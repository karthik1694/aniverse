from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import socketio
import asyncio
import random
import ssl
import certifi

# Import passport models
from passport_models import (
    AnimePassport, PassportBadge, UserPassportBadge, PassportJourney,
    EpisodeRoomVisit, PassportStats, PASSPORT_LEVELS, DEFAULT_BADGES,
    ANIME_VIBES, calculate_fate_number, get_passport_level_info
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import enhanced database connection with network error handling
from database_connection_fixed import get_database, close_database, is_database_available

# Database will be initialized in startup event
db = None

# In-memory storage for when database is unavailable (development only)
IN_MEMORY_SESSIONS = {}
IN_MEMORY_USERS = {}
IN_MEMORY_MODE = False

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Socket.IO setup for real-time chat
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    cors_credentials=True,
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=10000000  # 10MB max message size for images
)

# Mount Socket.IO on /api/socket.io so it goes through the ingress /api route
socket_app = socketio.ASGIApp(
    sio, 
    other_asgi_app=app,
    socketio_path='/api/socket.io'
)

# Store active connections and matching queue
active_users: Dict[str, Dict] = {}  # user_id -> {sid, user_data}
matching_queue: List[Dict] = []  # Users waiting to be matched
active_matches: Dict[str, Dict] = {}  # sid -> {partner_sid, user_id, partner_id}

# Store episode room connections
episode_room_users: Dict[str, Dict] = {}  # sid -> {room_id, user_id, user_data}
episode_rooms_cache: Dict[str, Dict] = {}  # room_id -> {room_data, users: []}

# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    bio: Optional[str] = ""
    gender: Optional[str] = None  # "male" or "female"
    favorite_anime: List[str] = []
    favorite_genres: List[str] = []
    favorite_themes: List[str] = []
    favorite_characters: List[str] = []
    premium: bool = False
    username_changes: int = 0  # Track number of username changes (max 3)
    isAnonymous: bool = False  # Track if user is anonymous
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnimeData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    genres: List[str]
    themes: List[str]
    image_url: Optional[str] = None

class FriendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Friendship(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user1_id: str
    user2_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_spoiler: bool = False

class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class EpisodeRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    anime_id: str
    anime_title: str
    episode_number: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=48))
    active_users_count: int = 0
    total_messages: int = 0

class EpisodeRoomMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_spoiler: bool = False
    spoiler_episode_number: Optional[int] = None

class UserEpisodeProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    anime_id: str
    episodes_watched: List[int] = []
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    favorite_anime: Optional[List[str]] = None
    favorite_genres: Optional[List[str]] = None
    favorite_themes: Optional[List[str]] = None
    favorite_characters: Optional[List[str]] = None

class UserReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reporter_user_id: str
    reported_user_id: str
    reason: str
    additional_details: Optional[str] = ""
    status: str = "pending"  # pending, reviewed, actioned, dismissed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewer_notes: Optional[str] = ""

class BlockedUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    blocker_user_id: str
    blocked_user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
class ArcMilestone(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    emoji: str
    trigger_type: str  # "friends_count", "messages_sent", "days_active", "episode_rooms_joined", etc.
    trigger_value: int
    arc_phase: str  # "prologue", "rising", "connection", "eclipse", "climax", "resolution"

class UserArc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    current_arc: str = "✨ Prologue Arc: Joined AniConnect"
    current_phase: str = "prologue"
    arc_progress: int = 0  # 0-100 percentage
    milestones_achieved: List[str] = []  # List of milestone IDs
    stats: dict = Field(default_factory=lambda: {
        "friends_count": 0,
        "messages_sent": 0,
        "days_active": 0,
        "episode_rooms_joined": 0,
        "matches_completed": 0,
        "episodes_watched": 0
    })
    arc_history: List[dict] = []  # Previous arcs achieved
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemoryFragment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_message: str  # The actual message content
    anonymized_message: str  # Anonymized version for sharing
    emotional_weight: float = 0.0  # 0.0 to 1.0 - how emotionally significant
    context_type: str  # "chat", "episode_room", "profile"
    anime_context: Optional[str] = None  # Related anime if applicable
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: str  # Original author (for personal memories)
    connection_id: Optional[str] = None  # Friend/chat partner ID (anonymized for sharing)
    is_shareable: bool = True  # Can be shared with connected users
    memory_type: str = "personal"  # "personal", "shared", "universal"
    tags: List[str] = []  # Emotional tags like "nostalgic", "deep", "relatable"

class UserMemoryCollection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    memory_fragments: List[str] = []  # List of MemoryFragment IDs
    last_memory_shown: Optional[datetime] = None
    memory_frequency_days: int = 7  # How often to show memories (default weekly)
    emotional_preferences: List[str] = ["nostalgic", "deep", "relatable", "inspiring"]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserDailyStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str  # YYYY-MM-DD format
    action: str  # "match_started", "episode_room_joined", "episode_room_created"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Auth Helper
async def get_current_user(request: Request) -> Optional[User]:
    # Check cookie first
    session_token = request.cookies.get('session_token')
    logging.debug(f"Session token from cookie: {session_token[:20] if session_token else 'None'}...")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            session_token = auth_header.replace('Bearer ', '')
            logging.debug(f"Session token from header: {session_token[:20]}...")
    
    if not session_token:
        logging.debug("No session token found in cookies or headers")
        return None
    
    # Check if this is an anonymous session token
    if session_token.startswith('anon_token_'):
        logging.debug("Anonymous session detected")
        # For anonymous users, we don't store in database
        # The frontend maintains the user data in localStorage
        # We just validate the token format and return None (frontend handles the user)
        # Socket.IO will handle anonymous users separately
        return None
    
    # Check in-memory sessions first (for development mode)
    if IN_MEMORY_MODE and session_token in IN_MEMORY_SESSIONS:
        session = IN_MEMORY_SESSIONS[session_token]
        # Check expiry
        if datetime.fromisoformat(session['expires_at']) < datetime.now(timezone.utc):
            logging.warning(f"In-memory session expired for user: {session['user_id']}")
            del IN_MEMORY_SESSIONS[session_token]
            return None
        
        # Get user from in-memory store
        user_data = IN_MEMORY_USERS.get(session['user_id'])
        if not user_data:
            logging.warning(f"User not found in memory for session user_id: {session['user_id']}")
            return None
        
        logging.debug(f"User authenticated from memory: {user_data.get('email')}")
        return User(**user_data)
    
    # Try database if available
    try:
        # Check session in database
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            logging.warning(f"Session not found in database for token: {session_token[:20]}...")
            return None
        
        # Check expiry
        if datetime.fromisoformat(session['expires_at']) < datetime.now(timezone.utc):
            logging.warning(f"Session expired for user: {session['user_id']}")
            return None
        
        # Get user
        user_doc = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
        if not user_doc:
            logging.warning(f"User not found for session user_id: {session['user_id']}")
            return None
        
        logging.debug(f"User authenticated successfully: {user_doc.get('email')}")
        return User(**user_doc)
    except Exception as e:
        logging.error(f"Error checking session in database: {e}")
        return None

# Initialize mock anime database
async def init_anime_db():
    count = await db.anime_data.count_documents({})
    if count == 0:
        mock_anime = [
            {"id": str(uuid.uuid4()), "title": "Attack on Titan", "genres": ["Action", "Drama", "Fantasy"], "themes": ["Military", "Survival"], "image_url": "https://cdn.myanimelist.net/images/anime/10/47347.jpg"},
            {"id": str(uuid.uuid4()), "title": "Death Note", "genres": ["Mystery", "Psychological", "Thriller"], "themes": ["Detective", "Supernatural"], "image_url": "https://cdn.myanimelist.net/images/anime/9/9453.jpg"},
            {"id": str(uuid.uuid4()), "title": "My Hero Academia", "genres": ["Action", "Comedy"], "themes": ["School", "Super Power"], "image_url": "https://cdn.myanimelist.net/images/anime/10/78745.jpg"},
            {"id": str(uuid.uuid4()), "title": "Demon Slayer", "genres": ["Action", "Fantasy"], "themes": ["Historical", "Demons"], "image_url": "https://cdn.myanimelist.net/images/anime/1286/99889.jpg"},
            {"id": str(uuid.uuid4()), "title": "One Piece", "genres": ["Action", "Adventure", "Fantasy"], "themes": ["Pirates"], "image_url": "https://cdn.myanimelist.net/images/anime/6/73245.jpg"},
            {"id": str(uuid.uuid4()), "title": "Naruto", "genres": ["Action", "Adventure"], "themes": ["Ninja", "Martial Arts"], "image_url": "https://cdn.myanimelist.net/images/anime/13/17405.jpg"},
            {"id": str(uuid.uuid4()), "title": "Steins;Gate", "genres": ["Sci-Fi", "Thriller"], "themes": ["Time Travel"], "image_url": "https://cdn.myanimelist.net/images/anime/5/73199.jpg"},
            {"id": str(uuid.uuid4()), "title": "Fullmetal Alchemist: Brotherhood", "genres": ["Action", "Adventure", "Drama", "Fantasy"], "themes": ["Military"], "image_url": "https://cdn.myanimelist.net/images/anime/1223/96541.jpg"},
            {"id": str(uuid.uuid4()), "title": "Sword Art Online", "genres": ["Action", "Adventure", "Fantasy", "Romance"], "themes": ["Video Games"], "image_url": "https://cdn.myanimelist.net/images/anime/11/39717.jpg"},
            {"id": str(uuid.uuid4()), "title": "Your Name", "genres": ["Drama", "Romance", "Supernatural"], "themes": ["School"], "image_url": "https://cdn.myanimelist.net/images/anime/5/87048.jpg"},
            {"id": str(uuid.uuid4()), "title": "Jujutsu Kaisen", "genres": ["Action", "Fantasy"], "themes": ["School", "Supernatural"], "image_url": "https://cdn.myanimelist.net/images/anime/1171/109222.jpg"},
            {"id": str(uuid.uuid4()), "title": "Chainsaw Man", "genres": ["Action", "Fantasy"], "themes": ["Gore", "Supernatural"], "image_url": "https://cdn.myanimelist.net/images/anime/1806/126216.jpg"},
            {"id": str(uuid.uuid4()), "title": "Spy x Family", "genres": ["Action", "Comedy"], "themes": ["Childcare"], "image_url": "https://cdn.myanimelist.net/images/anime/1441/122795.jpg"},
            {"id": str(uuid.uuid4()), "title": "Tokyo Ghoul", "genres": ["Action", "Drama", "Horror", "Mystery", "Supernatural"], "themes": ["Gore", "Psychological"], "image_url": "https://cdn.myanimelist.net/images/anime/5/64449.jpg"},
            {"id": str(uuid.uuid4()), "title": "Hunter x Hunter", "genres": ["Action", "Adventure", "Fantasy"], "themes": ["Super Power"], "image_url": "https://cdn.myanimelist.net/images/anime/11/33657.jpg"},
        ]
        await db.anime_data.insert_many(mock_anime)
        logging.info(f"Initialized anime database with {len(mock_anime)} entries")

# Background task for cleaning up expired rooms
async def cleanup_expired_rooms():
    """Background task that runs every hour to clean up expired episode rooms"""
    while True:
        try:
            await asyncio.sleep(3600)  # Run every hour
            
            # Skip cleanup if database is not available
            if db is None:
                logging.info("Skipping room cleanup - database not available")
                continue
            
            now = datetime.now(timezone.utc)
            logging.info("Running expired room cleanup task...")
            
            # Find expired rooms
            expired_rooms = await db.episode_rooms.find(
                {"expires_at": {"$lt": now.isoformat()}},
                {"_id": 0}
            ).to_list(100)
            
            for room in expired_rooms:
                room_id = room['id']
                
                # Remove from cache
                if room_id in episode_rooms_cache:
                    del episode_rooms_cache[room_id]
                
                # Notify any remaining users
                await sio.emit('episode_room_expired', {'room_id': room_id}, room=room_id)
                
                logging.info(f"Cleaned up expired room: {room_id} ({room['anime_title']} Ep {room['episode_number']})")
            
            # Delete expired rooms from database
            if expired_rooms:
                result = await db.episode_rooms.delete_many(
                    {"expires_at": {"$lt": now.isoformat()}}
                )
                logging.info(f"Deleted {result.deleted_count} expired rooms from database")
            
        except Exception as e:
            logging.error(f"Error in cleanup_expired_rooms: {e}", exc_info=True)


@app.on_event("startup")
async def startup_event():
    global db
    try:
        # Initialize database connection with enhanced error handling
        logging.info("🚀 Initializing database connection...")
        
        # Check if database is available
        db_available = await is_database_available()
        
        if db_available:
            db = await get_database()
            logging.info("✅ Database connection established successfully")
            
            # Initialize application data only if database is available
            try:
                await init_anime_db()
                await initialize_passport_system()
                logging.info("✅ Application data initialized successfully")
            except Exception as init_error:
                logging.warning(f"⚠️ Application data initialization failed: {init_error}")
                logging.info("🔧 Server will continue with limited functionality")
        else:
            logging.warning("⚠️ Database connection not available")
            logging.info("🔧 Server starting in limited mode - some features may not work")
            logging.info("💡 This is normal in development when there are network connectivity issues")
            db = None
        
        # Start background cleanup task (will handle db=None gracefully)
        asyncio.create_task(cleanup_expired_rooms())
        logging.info("✅ Application startup completed successfully")
        
    except Exception as e:
        logging.error(f"❌ Application startup failed: {e}")
        logging.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logging.error(f"❌ Full traceback:\n{traceback.format_exc()}")
        
        # In development, allow server to start even with database issues
        if not os.getenv("RENDER") and not any(os.getenv(indicator) for indicator in ['DYNO', 'VERCEL', 'NETLIFY']):
            logging.warning("🔧 Development mode: Server will start despite database issues")
            logging.info("💡 Some features will be disabled until database connectivity is restored")
            db = None
        else:
            # In production, database is required
            raise

@app.on_event("shutdown")
async def shutdown_event():
    """Clean shutdown of database connections."""
    try:
        logging.info("🔌 Closing database connection...")
        await close_database()
        logging.info("✅ Database connection closed successfully")
    except Exception as e:
        logging.error(f"❌ Error during shutdown: {e}")

# Calculate compatibility score
def calculate_compatibility(user1: User, user2: User) -> int:
    score = 0
    
    # Check what data is available
    has_anime = bool(user1.favorite_anime and user2.favorite_anime)
    has_genres = bool(user1.favorite_genres and user2.favorite_genres)
    has_themes = bool(user1.favorite_themes and user2.favorite_themes)
    has_characters = bool(user1.favorite_characters and user2.favorite_characters)
    
    # Shared favorite anime (High weight - 40 points)
    shared_anime = set(user1.favorite_anime) & set(user2.favorite_anime)
    score += len(shared_anime) * 10
    
    # Genre alignment - BOOSTED weight when it's the primary data available
    shared_genres = set(user1.favorite_genres) & set(user2.favorite_genres)
    if has_genres:
        # If users primarily use genres (no anime/themes/characters), give genres much more weight
        if not (has_anime or has_themes or has_characters):
            # Genres are the ONLY data - make them worth much more (up to 100 points)
            score += len(shared_genres) * 20
        else:
            # Standard weight when other data exists
            score += len(shared_genres) * 5
    
    # Theme alignment (Medium weight - 20 points)
    shared_themes = set(user1.favorite_themes) & set(user2.favorite_themes)
    score += len(shared_themes) * 4
    
    # Character affinity (Low-Medium weight - 10 points)
    shared_characters = set(user1.favorite_characters) & set(user2.favorite_characters)
    score += len(shared_characters) * 2
    
    return min(score, 100)  # Cap at 100

# Calculate shared anime universe data
def calculate_shared_universe(user1: User, user2: User) -> Dict:
    shared_anime = list(set(user1.favorite_anime) & set(user2.favorite_anime))
    shared_genres = list(set(user1.favorite_genres) & set(user2.favorite_genres))
    shared_themes = list(set(user1.favorite_themes) & set(user2.favorite_themes))
    
    # Generate conversation starters based on shared content
    conversation_starters = []
    
    if shared_anime:
        # Pick a random shared anime for conversation starter
        anime = random.choice(shared_anime)
        starters = [
            f"What did you think of {anime}?",
            f"Which character from {anime} is your favorite?",
            f"What was your favorite arc in {anime}?",
            f"Did you enjoy the ending of {anime}?"
        ]
        conversation_starters.append(random.choice(starters))
    
    if shared_genres and len(conversation_starters) < 2:
        genre = shared_genres[0]
        conversation_starters.append(f"What's your favorite {genre} anime?")
    
    if shared_themes and len(conversation_starters) < 2:
        theme = shared_themes[0]
        conversation_starters.append(f"Do you enjoy {theme} themed anime?")
    
    # If no shared content, add generic starters for random matches
    if not conversation_starters:
        generic_starters = [
            "What anime are you currently watching?",
            "What got you into anime?",
            "Do you have a favorite anime genre?",
            "Any anime recommendations for me?",
            "What's the first anime you ever watched?",
            "Are you watching anything this season?",
            "What's your all-time favorite anime?",
            "Do you prefer subbed or dubbed anime?"
        ]
        # Add 2-3 random generic starters
        conversation_starters = random.sample(generic_starters, min(3, len(generic_starters)))
    
    return {
        'shared_anime': shared_anime,
        'shared_genres': shared_genres,
        'shared_themes': shared_themes,
        'conversation_starters': conversation_starters
    }

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AniChat.gg API"}

# Add root route for the main app (for health checks and deployment verification)
@app.get("/")
async def app_root():
    return {
        "message": "AniConnect Backend Server",
        "status": "running",
        "api_endpoint": "/api",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    try:
        # Test database connection
        await db.admin.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail={
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

@api_router.post("/auth/session")
async def create_session(response: Response, session_id: str):
    """Exchange session_id for user data and session_token"""
    global IN_MEMORY_MODE
    try:
        # Call Emergent auth service with SSL certificate verification
        import aiohttp
        
        # Create SSL context with certifi's CA bundle
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    logging.error(f"Auth service returned {resp.status}: {text}")
                    raise HTTPException(status_code=401, detail="Invalid or expired session")
                
                data = await resp.json()
        
        logging.info(f"OAuth data received for: {data.get('email')}")
        
        # Check if database is available
        db_available = False
        try:
            if db:
                await db.command('ping')
                db_available = True
                logging.info("Database is available")
        except Exception as e:
            logging.warning(f"Database not available, using in-memory mode: {e}")
            IN_MEMORY_MODE = True
        
        # Create or get user
        if db_available:
            # Check if user exists in database
            existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
            
            if not existing_user:
                # Create new user
                user = User(
                    email=data["email"],
                    name=data["name"],
                    picture=data.get("picture")
                )
                user_dict = user.dict()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.users.insert_one(user_dict)
            else:
                user = User(**existing_user)
        else:
            # Use in-memory storage
            logging.info("Using in-memory user storage")
            user_id = None
            # Check if user exists in memory by email
            for uid, udata in IN_MEMORY_USERS.items():
                if udata.get('email') == data["email"]:
                    user_id = uid
                    user = User(**udata)
                    break
            
            if not user_id:
                # Create new user in memory
                user = User(
                    email=data["email"],
                    name=data["name"],
                    picture=data.get("picture")
                )
                user_dict = user.dict()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                IN_MEMORY_USERS[user.id] = user_dict
                logging.info(f"Created user in memory: {user.email}")
        
        # Create session
        session_token = data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        if db_available:
            session_obj = UserSession(
                user_id=user.id,
                session_token=session_token,
                expires_at=expires_at
            )
            session_dict = session_obj.dict()
            session_dict['expires_at'] = session_dict['expires_at'].isoformat()
            session_dict['created_at'] = session_dict['created_at'].isoformat()
            
            await db.user_sessions.insert_one(session_dict)
        else:
            # Store session in memory
            IN_MEMORY_SESSIONS[session_token] = {
                'user_id': user.id,
                'session_token': session_token,
                'expires_at': expires_at.isoformat(),
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            logging.info(f"Created session in memory for user: {user.email}")
        
        # Set cookie with proper configuration for cross-origin deployment
        is_production = os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT")
        
        # Set cookie - for local development, use 'lax' but ensure it works
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=is_production,  # Only secure in production (HTTPS)
            samesite="none" if is_production else "lax",  # None for cross-origin, lax for local
            path="/",
            max_age=7*24*60*60,
            domain=None  # Let browser handle domain automatically
        )
        
        logging.info(f"Session created for user {user.email} (ID: {user.id})")
        logging.info(f"Cookie settings - Production: {is_production}, SameSite: {'none' if is_production else 'lax'}")
        logging.info(f"Storage mode: {'Database' if db_available else 'In-Memory'}")
        
        return {"user": user.dict(), "session_token": session_token}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Session creation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/auth/me")
async def get_me(request: Request):
    logging.info(f"Auth/me called - Cookies: {dict(request.cookies)}")
    logging.info(f"Auth/me called - Headers: {dict(request.headers)}")
    
    user = await get_current_user(request)
    if not user:
        logging.warning("No user found in auth/me endpoint")
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    logging.info(f"User authenticated: {user.email}")
    return user.dict()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get('session_token')
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/anime")
async def get_anime(q: Optional[str] = None, request: Request = None):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    if q:
        anime_list = await db.anime_data.find(
            {"title": {"$regex": q, "$options": "i"}},
            {"_id": 0}
        ).limit(20).to_list(20)
    else:
        anime_list = await db.anime_data.find({}, {"_id": 0}).limit(50).to_list(50)
    
    return anime_list

@api_router.put("/profile")
async def update_profile(profile: ProfileUpdate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    update_data = {k: v for k, v in profile.dict().items() if v is not None}
    
    # Handle username changes with limit
    if 'name' in update_data and update_data['name'] != user.name:
        current_changes = user.username_changes or 0
        if current_changes >= 3:
            raise HTTPException(status_code=400, detail="Maximum username changes (3) reached")
        update_data['username_changes'] = current_changes + 1
    
    if update_data:
        await db.users.update_one({"id": user.id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user.id}, {"_id": 0})
    return User(**updated_user).dict()

@api_router.get("/friends")
async def get_friends(request: Request):
    logging.info("🔵 Get friends endpoint called")
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for anonymous user in query params
    if not user:
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            logging.error("❌ No authenticated user and no user_id provided")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Verify the user exists in database
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            logging.error(f"❌ User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        logging.info(f"✅ Anonymous user requesting friends: {user.name} ({user.id})")
    else:
        logging.info(f"✅ Authenticated user requesting friends: {user.name} ({user.id})")
    
    friendships = await db.friendships.find(
        {"$or": [{"user1_id": user.id}, {"user2_id": user.id}]},
        {"_id": 0}
    ).to_list(100)
    
    logging.info(f"💬 Found {len(friendships)} friendships for {user.name}")
    
    # Use a set to avoid duplicate friend IDs
    friend_ids = set()
    for f in friendships:
        friend_id = f['user2_id'] if f['user1_id'] == user.id else f['user1_id']
        friend_ids.add(friend_id)
    
    friends = []
    for friend_id in friend_ids:
        friend_doc = await db.users.find_one({"id": friend_id}, {"_id": 0})
        if friend_doc:
            friends.append(User(**friend_doc).dict())
    
    logging.info(f"✅ Returning {len(friends)} friends for {user.name}")
    return friends

@api_router.post("/friend-requests/{to_user_id}")
async def send_friend_request(to_user_id: str, request: Request):
    try:
        logging.info(f"🔵 Friend request endpoint called: to_user_id={to_user_id}")
        
        # Check if database is available
        if db is None:
            logging.error("❌ Database not available for friend request")
            raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again.")
        
        # Read request body FIRST (can only be read once)
        body = None
        try:
            body = await request.json()
            logging.info(f"📝 Request body received: {json.dumps(body, default=str)[:200]}")
        except Exception as e:
            logging.info(f"ℹ️ No JSON body in request: {e}")
        
        # Try to get authenticated user
        user = await get_current_user(request)
        logging.info(f"🔑 get_current_user result: {user.name if user else 'None'}")
        
        # If no authenticated user, check for user data in request body (fallback authentication)
        if not user:
            logging.info("🟡 No authenticated user from session, checking request body for user data...")
            
            if not body:
                logging.error("❌ No request body and no authenticated user")
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_data = body.get('user_data')
            logging.info(f"👤 user_data from body: {user_data.get('name') if user_data else 'None'}")
            
            if not user_data:
                logging.error("❌ No user_data in request body")
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Get user ID from request body
            user_id = user_data.get('id')
            if not user_id:
                logging.error("❌ User data missing ID")
                raise HTTPException(status_code=401, detail="Invalid user data")
            
            is_anonymous = user_data.get('isAnonymous', False)
            logging.info(f"✅ User from request body: {user_data.get('name')} (ID: {user_id}, anonymous: {is_anonymous})")
            
            try:
                existing_user = await db.users.find_one({"id": user_id}, {"_id": 0})
                
                if not existing_user:
                    if is_anonymous:
                        # Create anonymous user in database
                        user_dict = user_data.copy()
                        if 'created_at' not in user_dict:
                            user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                        elif isinstance(user_dict.get('created_at'), datetime):
                            user_dict['created_at'] = user_dict['created_at'].isoformat()
                        await db.users.insert_one(user_dict)
                        logging.info(f"✅ Created anonymous user in DB: {user_data.get('name')} (ID: {user_id})")
                    else:
                        # Non-anonymous user not found in database
                        logging.error(f"❌ Non-anonymous user not found in DB: {user_id}")
                        raise HTTPException(status_code=401, detail="User not found. Please log in again.")
                else:
                    # Update user data (in case interests were added)
                    user_dict = user_data.copy()
                    if isinstance(user_dict.get('created_at'), datetime):
                        user_dict['created_at'] = user_dict['created_at'].isoformat()
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": user_dict}
                    )
                    logging.info(f"✅ Updated user in DB: {user_data.get('name')} (ID: {user_id})")
                
                # Create a User object for validation
                user = User(**user_data)
                logging.info(f"✅ User authenticated via request body for friend request: {user.name}")
            except HTTPException:
                raise
            except Exception as e:
                logging.error(f"❌ Error handling user in database: {e}", exc_info=True)
                raise HTTPException(status_code=500, detail="Failed to process user")
        
        # Check if trying to send request to self
        if user.id == to_user_id:
            raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
        
        # Check if target user exists
        target_user = await db.users.find_one({"id": to_user_id}, {"_id": 0})
        if not target_user:
            logging.error(f"❌ Target user not found: {to_user_id}")
            raise HTTPException(status_code=404, detail="User not found. They may have disconnected.")
        
        # Check if already friends
        existing = await db.friendships.find_one({
            "$or": [
                {"user1_id": user.id, "user2_id": to_user_id},
                {"user1_id": to_user_id, "user2_id": user.id}
            ]
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Already friends")
        
        # Check if request already exists (bidirectional)
        existing_request = await db.friend_requests.find_one({
            "$or": [
                {"from_user_id": user.id, "to_user_id": to_user_id, "status": "pending"},
                {"from_user_id": to_user_id, "to_user_id": user.id, "status": "pending"}
            ]
        })
        
        if existing_request:
            if existing_request['from_user_id'] == user.id:
                raise HTTPException(status_code=400, detail="Request already sent")
            else:
                raise HTTPException(status_code=400, detail="This user has already sent you a friend request")
        
        friend_request = FriendRequest(
            from_user_id=user.id,
            to_user_id=to_user_id
        )
        
        req_dict = friend_request.dict()
        req_dict['created_at'] = req_dict['created_at'].isoformat()
        await db.friend_requests.insert_one(req_dict)
        
        logging.info(f"✅ Friend request created: {user.name} ({user.id}) -> {to_user_id}")
        
        # Send real-time notification to the recipient if they're online
        if to_user_id in active_users:
            recipient_sid = active_users[to_user_id]['sid']
            # Get sender info for notification
            sender_info = {
                'request_id': friend_request.id,
                'from_user': {
                    'id': user.id,
                    'name': user.name,
                    'picture': user.picture
                }
            }
            await sio.emit('friend_request_received', sender_info, room=recipient_sid)
            logging.info(f"📨 Real-time friend request notification sent to {to_user_id}")
        
        return {"message": "Friend request sent"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ Unexpected error in send_friend_request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send friend request: {str(e)}")

@api_router.get("/friend-requests")
async def get_friend_requests(request: Request):
    logging.info("🔵 Get friend requests endpoint called")
    
    # Read request body first (for anonymous users)
    body = None
    try:
        body = await request.json()
    except Exception:
        pass  # GET requests typically don't have body, but check anyway
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for anonymous user in query params or body
    if not user:
        # For GET requests, anonymous users should pass user_id as query parameter
        user_id = request.query_params.get('user_id')
        
        if not user_id and body:
            user_data = body.get('user_data')
            if user_data:
                user_id = user_data.get('id')
        
        if not user_id:
            logging.error("❌ No authenticated user and no user_id provided")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Verify the user exists in database
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            logging.error(f"❌ User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        logging.info(f"✅ Anonymous user requesting friend requests: {user.name} ({user.id})")
    else:
        logging.info(f"✅ Authenticated user requesting friend requests: {user.name} ({user.id})")
    
    requests = await db.friend_requests.find(
        {"to_user_id": user.id, "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    logging.info(f"📥 Found {len(requests)} pending friend requests for {user.name}")
    
    result = []
    for req in requests:
        from_user_doc = await db.users.find_one({"id": req['from_user_id']}, {"_id": 0})
        if from_user_doc:
            result.append({
                "request": req,
                "from_user": User(**from_user_doc).dict()
            })
    
    return result

@api_router.post("/friend-requests/{request_id}/accept")
async def accept_friend_request(request_id: str, request: Request):
    logging.info(f"🔵 Accept friend request endpoint called: request_id={request_id}")
    
    # Read request body first
    body = None
    try:
        body = await request.json()
    except Exception:
        pass
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for user data in request body (fallback authentication)
    if not user:
        if not body or not body.get('user_data'):
            logging.error("❌ No authenticated user and no user_data in body")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = body.get('user_data')
        user_id = user_data.get('id')
        is_anonymous = user_data.get('isAnonymous', False)
        
        if not user_id:
            logging.error("❌ User data missing ID")
            raise HTTPException(status_code=401, detail="Invalid user data")
        
        # Verify user exists or create if anonymous
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            if is_anonymous:
                # Create anonymous user in database
                user_dict = user_data.copy()
                if 'created_at' not in user_dict:
                    user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                elif isinstance(user_dict.get('created_at'), datetime):
                    user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.users.insert_one(user_dict)
                logging.info(f"✅ Created anonymous user in DB: {user_data.get('name')} (ID: {user_id})")
            else:
                logging.error(f"❌ User not found: {user_id}")
                raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_data)
        logging.info(f"✅ User authenticated via request body for accepting request: {user.name}")
    
    friend_request = await db.friend_requests.find_one({"id": request_id}, {"_id": 0})
    if not friend_request:
        raise HTTPException(status_code=404)
    
    if friend_request['to_user_id'] != user.id:
        raise HTTPException(status_code=403)
    
    # Update request status
    await db.friend_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Create friendship
    friendship = Friendship(
        user1_id=friend_request['from_user_id'],
        user2_id=user.id
    )
    
    friend_dict = friendship.dict()
    friend_dict['created_at'] = friend_dict['created_at'].isoformat()
    await db.friendships.insert_one(friend_dict)
    
    # Update arc progression for both users
    await update_user_stats(user.id, "friends_count", 1)
    await update_user_stats(friend_request['from_user_id'], "friends_count", 1)
    
    # Update passport stats for both users
    await update_passport_stats(user.id, {"total_friends": 1, "successful_matches": 1})
    await update_passport_stats(friend_request['from_user_id'], {"total_friends": 1, "successful_matches": 1})
    
    # Update passport journey milestones
    for uid in [user.id, friend_request['from_user_id']]:
        journey = await db.passport_journeys.find_one({"user_id": uid}, {"_id": 0})
        if journey and not journey.get('first_friend_date'):
            await db.passport_journeys.update_one(
                {"user_id": uid},
                {"$set": {"first_friend_date": datetime.now(timezone.utc).isoformat()}}
            )
    
    # Send real-time notification to the requester that their request was accepted
    requester_id = friend_request['from_user_id']
    if requester_id in active_users:
        requester_sid = active_users[requester_id]['sid']
        # Get accepter info for notification
        accepter_info = {
            'friend': {
                'id': user.id,
                'name': user.name,
                'picture': user.picture
            }
        }
        await sio.emit('friend_request_accepted', accepter_info, room=requester_sid)
        logging.info(f"📨 Real-time acceptance notification sent to {requester_id}")
    
    return {"message": "Friend request accepted"}

@api_router.post("/friend-requests/{request_id}/reject")
async def reject_friend_request(request_id: str, request: Request):
    """Reject a friend request"""
    logging.info(f"🔵 Reject friend request endpoint called: request_id={request_id}")
    
    # Read request body first
    body = None
    try:
        body = await request.json()
    except Exception:
        pass
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for user data in request body (fallback authentication)
    if not user:
        if not body or not body.get('user_data'):
            logging.error("❌ No authenticated user and no user_data in body")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = body.get('user_data')
        user_id = user_data.get('id')
        is_anonymous = user_data.get('isAnonymous', False)
        
        if not user_id:
            logging.error("❌ User data missing ID")
            raise HTTPException(status_code=401, detail="Invalid user data")
        
        # Verify user exists or create if anonymous
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            if is_anonymous:
                # Create anonymous user in database
                user_dict = user_data.copy()
                if 'created_at' not in user_dict:
                    user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
                elif isinstance(user_dict.get('created_at'), datetime):
                    user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.users.insert_one(user_dict)
                logging.info(f"✅ Created anonymous user in DB: {user_data.get('name')} (ID: {user_id})")
            else:
                logging.error(f"❌ User not found: {user_id}")
                raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_data)
        logging.info(f"✅ User authenticated via request body for rejecting request: {user.name}")
    
    friend_request = await db.friend_requests.find_one({"id": request_id}, {"_id": 0})
    if not friend_request:
        raise HTTPException(status_code=404)
    
    if friend_request['to_user_id'] != user.id:
        raise HTTPException(status_code=403)
    
    # Update request status
    await db.friend_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "rejected"}}
    )
    
    return {"message": "Friend request rejected"}

@api_router.post("/admin/cleanup-duplicates")
async def cleanup_duplicate_requests(request: Request):
    """Clean up duplicate friend requests and friendships"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Remove duplicate pending friend requests
    pipeline = [
        {"$match": {"status": "pending"}},
        {"$group": {
            "_id": {
                "users": {"$cond": [
                    {"$lt": ["$from_user_id", "$to_user_id"]},
                    ["$from_user_id", "$to_user_id"],
                    ["$to_user_id", "$from_user_id"]
                ]}
            },
            "requests": {"$push": "$$ROOT"},
            "count": {"$sum": 1}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    duplicates = await db.friend_requests.aggregate(pipeline).to_list(100)
    
    removed_count = 0
    for duplicate_group in duplicates:
        requests = duplicate_group["requests"]
        # Keep the oldest request, remove the rest
        requests.sort(key=lambda x: x["created_at"])
        for req in requests[1:]:
            await db.friend_requests.delete_one({"id": req["id"]})
            removed_count += 1
    
    # Also clean up duplicate friendships
    friendship_pipeline = [
        {"$group": {
            "_id": {
                "users": {"$cond": [
                    {"$lt": ["$user1_id", "$user2_id"]},
                    ["$user1_id", "$user2_id"],
                    ["$user2_id", "$user1_id"]
                ]}
            },
            "friendships": {"$push": "$$ROOT"},
            "count": {"$sum": 1}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    friendship_duplicates = await db.friendships.aggregate(friendship_pipeline).to_list(100)
    
    friendship_removed_count = 0
    for duplicate_group in friendship_duplicates:
        friendships = duplicate_group["friendships"]
        # Keep the oldest friendship, remove the rest
        friendships.sort(key=lambda x: x["created_at"])
        for friendship in friendships[1:]:
            await db.friendships.delete_one({"id": friendship["id"]})
            friendship_removed_count += 1
    
    # Remove any self-friendships (user friended themselves)
    self_friendships = await db.friendships.find(
        {"$expr": {"$eq": ["$user1_id", "$user2_id"]}}
    ).to_list(100)
    
    self_friendship_count = 0
    for self_friendship in self_friendships:
        await db.friendships.delete_one({"id": self_friendship["id"]})
        self_friendship_count += 1
    
    return {
        "message": f"Cleaned up {removed_count} duplicate friend requests, {friendship_removed_count} duplicate friendships, and {self_friendship_count} self-friendships"
    }

@api_router.get("/chat/history/{friend_id}")
async def get_chat_history(friend_id: str, request: Request):
    logging.info(f"🔵 Get chat history endpoint called: friend_id={friend_id}")
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for anonymous user in query params
    if not user:
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            logging.error("❌ No authenticated user and no user_id provided")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Verify the user exists in database
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            logging.error(f"❌ User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        logging.info(f"✅ Anonymous user requesting chat history: {user.name} ({user.id})")
    else:
        logging.info(f"✅ Authenticated user requesting chat history: {user.name} ({user.id})")
    
    # Verify friendship exists - only friends can access chat history
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user.id, "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": user.id}
        ]
    })
    
    if not friendship:
        raise HTTPException(status_code=403, detail="Not friends with this user")
    
    # Get direct messages between these two users from the correct collection
    messages = await db.direct_messages.find(
        {"$or": [
            {"from_user_id": user.id, "to_user_id": friend_id},
            {"from_user_id": friend_id, "to_user_id": user.id}
        ]},
        {"_id": 0}
    ).sort("timestamp", 1).limit(100).to_list(100)
    
    # Get friend info for message display
    friend = await db.users.find_one({"id": friend_id}, {"_id": 0, "name": 1, "picture": 1})
    
    # Add sender info to messages for consistent display
    for message in messages:
        if message['from_user_id'] == user.id:
            message['from_user_name'] = user.name
            message['from_user_picture'] = user.picture
        else:
            message['from_user_name'] = friend['name'] if friend else 'Unknown'
            message['from_user_picture'] = friend.get('picture') if friend else None
    
    return messages

# Episode Rooms API Endpoints
@api_router.get("/episode-rooms/trending")
async def get_trending_rooms(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Get active rooms (not expired)
    now = datetime.now(timezone.utc)
    rooms = await db.episode_rooms.find(
        {"expires_at": {"$gt": now.isoformat()}},
        {"_id": 0}
    ).sort("active_users_count", -1).limit(20).to_list(20)
    
    # Get anime info for each room
    result = []
    for room in rooms:
        anime = await db.anime_data.find_one({"id": room['anime_id']}, {"_id": 0})
        if anime:
            room['anime_info'] = anime
            result.append(room)
    
    return result

@api_router.post("/episode-rooms/create")
async def create_episode_room(anime_id: str, episode_number: int, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Check if user can create episode rooms (premium feature)
    can_create = await check_premium_limit(user.id, "can_create_episode_rooms")
    if not can_create:
        raise HTTPException(status_code=403, detail="Creating episode rooms is a premium feature. Upgrade to premium to create rooms!")
    
    # Check if room already exists for this anime/episode
    existing = await db.episode_rooms.find_one({
        "anime_id": anime_id,
        "episode_number": episode_number,
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    if existing:
        return {"room": existing, "created": False}
    
    # Get anime info
    anime = await db.anime_data.find_one({"id": anime_id}, {"_id": 0})
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    
    # Create new room
    room = EpisodeRoom(
        anime_id=anime_id,
        anime_title=anime['title'],
        episode_number=episode_number
    )
    
    room_dict = room.dict()
    room_dict['created_at'] = room_dict['created_at'].isoformat()
    room_dict['expires_at'] = room_dict['expires_at'].isoformat()
    
    await db.episode_rooms.insert_one(room_dict)
    
    # Track daily stat for room creation
    await track_daily_stat(user.id, "episode_room_created")
    
    return {"room": room_dict, "created": True}

@api_router.get("/episode-rooms/{room_id}")
async def get_room_details(room_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    room = await db.episode_rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if expired
    if datetime.fromisoformat(room['expires_at']) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Room has expired")
    
    # Get anime info
    anime = await db.anime_data.find_one({"id": room['anime_id']}, {"_id": 0})
    if anime:
        room['anime_info'] = anime
    
    return room

@api_router.get("/episode-rooms/{room_id}/messages")
async def get_room_messages(room_id: str, request: Request, limit: int = 50):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    messages = await db.episode_room_messages.find(
        {"room_id": room_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return list(reversed(messages))

@api_router.get("/direct-messages/{friend_id}")
async def get_direct_messages(friend_id: str, request: Request, limit: int = 50):
    logging.info(f"🔵 Get direct messages endpoint called: friend_id={friend_id}")
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for anonymous user in query params
    if not user:
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            logging.error("❌ No authenticated user and no user_id provided")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Verify the user exists in database
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            logging.error(f"❌ User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        logging.info(f"✅ Anonymous user requesting direct messages: {user.name} ({user.id})")
    else:
        logging.info(f"✅ Authenticated user requesting direct messages: {user.name} ({user.id})")
    
    # Verify friendship exists
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user.id, "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": user.id}
        ]
    })
    
    if not friendship:
        raise HTTPException(status_code=403, detail="Not friends with this user")
    
    # Get direct messages between these two users
    messages = await db.direct_messages.find(
        {
            "$or": [
                {"from_user_id": user.id, "to_user_id": friend_id},
                {"from_user_id": friend_id, "to_user_id": user.id}
            ]
        },
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Get friend info for message display
    friend = await db.users.find_one({"id": friend_id}, {"_id": 0, "name": 1, "picture": 1})
    
    # Add sender info to messages
    for message in messages:
        if message['from_user_id'] == user.id:
            message['from_user_name'] = user.name
            message['from_user_picture'] = user.picture
        else:
            message['from_user_name'] = friend['name'] if friend else 'Unknown'
            message['from_user_picture'] = friend.get('picture') if friend else None
    
    return {
        'messages': list(reversed(messages)),
        'friend': friend
    }

@api_router.get("/unread-counts")
async def get_unread_counts(request: Request):
    logging.info("🔵 Get unread counts endpoint called")
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for anonymous user in query params
    if not user:
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            logging.error("❌ No authenticated user and no user_id provided")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Verify the user exists in database
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            logging.error(f"❌ User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        logging.info(f"✅ Anonymous user requesting unread counts: {user.name} ({user.id})")
    else:
        logging.info(f"✅ Authenticated user requesting unread counts: {user.name} ({user.id})")
    
    # Get all friends
    friendships = await db.friendships.find({
        "$or": [
            {"user1_id": user.id},
            {"user2_id": user.id}
        ]
    }).to_list(None)
    
    unread_counts = {}
    
    for friendship in friendships:
        # Determine friend ID
        friend_id = friendship['user2_id'] if friendship['user1_id'] == user.id else friendship['user1_id']
        
        # Count unread messages from this friend to current user
        unread_count = await db.direct_messages.count_documents({
            "from_user_id": friend_id,
            "to_user_id": user.id,
            "read": False
        })
        
        unread_counts[friend_id] = unread_count
    
    return unread_counts

@api_router.post("/mark-messages-read/{friend_id}")
async def mark_messages_read(friend_id: str, request: Request):
    logging.info(f"🔵 Mark messages read endpoint called: friend_id={friend_id}")
    
    # Read request body first
    body = None
    try:
        body = await request.json()
        logging.info(f"📝 Request body received: {json.dumps(body, default=str)[:200]}")
    except Exception as e:
        logging.info(f"ℹ️ No JSON body in request: {e}")
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for anonymous user data in request body
    if not user:
        logging.info("🟡 No authenticated user, checking request body for anonymous user...")
        
        if not body:
            logging.error("❌ No request body and no authenticated user")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = body.get('user_data')
        if not user_data:
            logging.error("❌ No user_data in request body")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Verify the user exists in database
        user_doc = await db.users.find_one({"id": user_data.get('id')}, {"_id": 0})
        if not user_doc:
            logging.error(f"❌ User not found in database: {user_data.get('id')}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_data)
        logging.info(f"✅ Anonymous user authenticated for mark read: {user.name}")
    else:
        logging.info(f"✅ Authenticated user marking messages read: {user.name}")
    
    # Verify friendship exists
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user.id, "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": user.id}
        ]
    })
    
    if not friendship:
        raise HTTPException(status_code=403, detail="Not friends with this user")
    
    # Mark all messages from friend to user as read
    result = await db.direct_messages.update_many(
        {
            "from_user_id": friend_id,
            "to_user_id": user.id,
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    return {"marked_read": result.modified_count}

@api_router.get("/check-friendship/{user_id}")
async def check_friendship(user_id: str, request: Request):
    logging.info(f"🔵 Check friendship endpoint called: user_id={user_id}")
    
    # Try to get authenticated user
    user = await get_current_user(request)
    
    # If no authenticated user, check for anonymous user in query params
    if not user:
        query_user_id = request.query_params.get('user_id')
        
        if not query_user_id:
            logging.error("❌ No authenticated user and no user_id provided")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Verify the user exists in database
        user_doc = await db.users.find_one({"id": query_user_id}, {"_id": 0})
        if not user_doc:
            logging.error(f"❌ User not found in database: {query_user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        logging.info(f"✅ Anonymous user checking friendship: {user.name} ({user.id})")
    else:
        logging.info(f"✅ Authenticated user checking friendship: {user.name} ({user.id})")
    
    # Check if friendship exists
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user.id, "user2_id": user_id},
            {"user1_id": user_id, "user2_id": user.id}
        ]
    })
    
    return {"is_friend": friendship is not None}

@api_router.post("/user/episode-progress")
async def update_episode_progress(anime_id: str, episode_number: int, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Find existing progress
    progress = await db.user_episode_progress.find_one({
        "user_id": user.id,
        "anime_id": anime_id
    })
    
    if progress:
        # Update episodes watched
        episodes = progress.get('episodes_watched', [])
        if episode_number not in episodes:
            episodes.append(episode_number)
            episodes.sort()
        
        await db.user_episode_progress.update_one(
            {"user_id": user.id, "anime_id": anime_id},
            {"$set": {
                "episodes_watched": episodes,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Create new progress
        new_progress = UserEpisodeProgress(
            user_id=user.id,
            anime_id=anime_id,
            episodes_watched=[episode_number]
        )
        
        progress_dict = new_progress.dict()
        progress_dict['last_updated'] = progress_dict['last_updated'].isoformat()
        
        await db.user_episode_progress.insert_one(progress_dict)
    
    return {"message": "Progress updated"}

@api_router.get("/user/episode-progress/{anime_id}")
async def get_episode_progress(anime_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    progress = await db.user_episode_progress.find_one({
        "user_id": user.id,
        "anime_id": anime_id
    }, {"_id": 0})
    
    if not progress:
        return {"episodes_watched": []}
    return progress

# Premium System Models
class PremiumSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan_type: str = "premium"  # "premium", "premium_plus"
    status: str = "active"  # "active", "cancelled", "expired"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30))
    payment_method: Optional[str] = None
    amount_paid: float = 9.99
    currency: str = "USD"

# Premium Features Configuration
PREMIUM_FEATURES = {
    "free": {
        "max_daily_matches": 999999,  # Unlimited matches for free users
        "max_episode_rooms_per_day": 999999,  # Unlimited episode rooms
        "can_create_episode_rooms": True,  # Allow free users to create rooms
        "advanced_matching": True,
        "priority_support": False,
        "custom_profile_themes": False,
        "unlimited_friend_requests": True,
        "video_chat_duration_minutes": 999999,  # Unlimited video chat
        "can_see_who_liked": False
    },
    "premium": {
        "max_daily_matches": 999999,  # Unlimited matches for premium users
        "max_episode_rooms_per_day": 999999,  # Unlimited episode rooms
        "can_create_episode_rooms": True,
        "advanced_matching": True,
        "priority_support": True,
        "custom_profile_themes": True,
        "unlimited_friend_requests": True,
        "video_chat_duration_minutes": 999999,  # Unlimited video chat
        "can_see_who_liked": True
    }
}

# Premium Helper Functions
async def get_user_premium_status(user_id: str) -> dict:
    """Get user's premium status and features"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {"is_premium": False, "features": PREMIUM_FEATURES["free"]}
    
    is_premium = user.get("premium", False)
    
    if is_premium:
        # Check if subscription is still active
        subscription = await db.premium_subscriptions.find_one({
            "user_id": user_id,
            "status": "active",
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
        })
        
        if subscription:
            return {"is_premium": True, "features": PREMIUM_FEATURES["premium"], "subscription": subscription}
        else:
            # Subscription expired, update user
            await db.users.update_one({"id": user_id}, {"$set": {"premium": False}})
            return {"is_premium": False, "features": PREMIUM_FEATURES["free"]}
    
    return {"is_premium": False, "features": PREMIUM_FEATURES["free"]}

async def check_premium_limit(user_id: str, feature: str, current_count: int = 0) -> bool:
    """Check if user has reached premium limits for a feature"""
    premium_status = await get_user_premium_status(user_id)
    features = premium_status["features"]
    
    if feature == "daily_matches":
        return current_count < features["max_daily_matches"]
    elif feature == "episode_rooms_per_day":
        return current_count < features["max_episode_rooms_per_day"]
    elif feature == "can_create_episode_rooms":
        return features["can_create_episode_rooms"]
    elif feature == "video_chat_duration":
        return True  # Duration is handled in frontend
    
    return True

async def track_daily_stat(user_id: str, action: str):
    """Track daily user statistics for premium limits"""
    today = datetime.now(timezone.utc).date()
    stat = UserDailyStats(
        user_id=user_id,
        date=today.isoformat(),
        action=action
    )
    
    stat_dict = stat.dict()
    stat_dict['timestamp'] = stat_dict['timestamp'].isoformat()
    
    await db.user_daily_stats.insert_one(stat_dict)

# Premium API Endpoints
@api_router.get("/premium/status")
async def get_premium_status(request: Request):
    """Get user's premium status and available features"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    premium_status = await get_user_premium_status(user.id)
    return premium_status

@api_router.post("/premium/upgrade")
async def upgrade_to_premium(plan_type: str = "premium", request: Request = None):
    """Simulate premium upgrade (in real app, this would integrate with Stripe)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Check if user already has active subscription
    existing_sub = await db.premium_subscriptions.find_one({
        "user_id": user.id,
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    if existing_sub:
        raise HTTPException(status_code=400, detail="User already has active premium subscription")
    
    # Create new subscription
    subscription = PremiumSubscription(
        user_id=user.id,
        plan_type=plan_type,
        amount_paid=9.99 if plan_type == "premium" else 19.99
    )
    
    sub_dict = subscription.dict()
    sub_dict['started_at'] = sub_dict['started_at'].isoformat()
    sub_dict['expires_at'] = sub_dict['expires_at'].isoformat()
    
    await db.premium_subscriptions.insert_one(sub_dict)
    
    # Update user premium status
    await db.users.update_one({"id": user.id}, {"$set": {"premium": True}})
    
    return {"message": "Successfully upgraded to premium!", "subscription": sub_dict}

@api_router.post("/premium/cancel")
async def cancel_premium(request: Request):
    """Cancel premium subscription"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Find active subscription
    subscription = await db.premium_subscriptions.find_one({
        "user_id": user.id,
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Cancel subscription (but let it run until expiry)
    await db.premium_subscriptions.update_one(
        {"id": subscription["id"]},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Premium subscription cancelled. You'll retain premium features until your current billing period ends."}

# Arc System Helper Functions
async def initialize_user_arc(user_id: str):
    """Initialize arc system for a new user"""
    existing_arc = await db.user_arcs.find_one({"user_id": user_id})
    if existing_arc:
        return existing_arc
    
    user_arc = UserArc(user_id=user_id)
    arc_dict = user_arc.dict()
    await db.user_arcs.insert_one(arc_dict)
    return arc_dict

async def update_user_stats(user_id: str, stat_type: str, increment: int = 1):
    """Update user stats and check for arc progression"""
    # Update stats
    await db.user_arcs.update_one(
        {"user_id": user_id},
        {
            "$inc": {f"stats.{stat_type}": increment},
            "$set": {"last_updated": datetime.now(timezone.utc)}
        },
        upsert=True
    )
    
    # Check for arc progression
    await check_arc_progression(user_id)

async def check_arc_progression(user_id: str):
    """Check if user should progress to next arc based on milestones"""
    user_arc = await db.user_arcs.find_one({"user_id": user_id})
    if not user_arc:
        await initialize_user_arc(user_id)
        return
    
    stats = user_arc.get("stats", {})
    current_phase = user_arc.get("current_phase", "prologue")
    
    # Check for Redemption Arc (returning after 7+ days)
    await check_redemption_arc(user_id, user_arc)
    
    # Define anime-style arc progression logic
    arc_progressions = [
        {
            "phase": "prologue",
            "next_arc": "⚡ Connection Arc: First Match Found",
            "next_phase": "connection",
            "condition": stats.get("matches_completed", 0) >= 1,
            "milestone": "first_match"
        },
        {
            "phase": "connection",
            "next_arc": "🔥 Rising Bond Arc: 100 Messages Shared",
            "next_phase": "rising_bond",
            "condition": stats.get("messages_sent", 0) >= 100,
            "milestone": "chatty_character"
        },
        {
            "phase": "rising_bond",
            "next_arc": "🌟 Adventure Arc: Episode Rooms Explorer",
            "next_phase": "adventure",
            "condition": stats.get("episode_rooms_joined", 0) >= 5,
            "milestone": "room_explorer"
        },
        {
            "phase": "adventure",
            "next_arc": "👑 Power Arc: Social Butterfly",
            "next_phase": "power",
            "condition": stats.get("friends_count", 0) >= 3 and stats.get("messages_sent", 0) >= 250,
            "milestone": "social_butterfly"
        },
        {
            "phase": "power",
            "next_arc": "🌙 Eclipse Arc: Master Connector",
            "next_phase": "eclipse",
            "condition": stats.get("friends_count", 0) >= 10 and stats.get("episode_rooms_joined", 0) >= 20,
            "milestone": "master_connector"
        }
    ]
    
    # Check for progression
    for progression in arc_progressions:
        if current_phase == progression["phase"] and progression["condition"]:
            # Update to next arc
            arc_history_entry = {
                "arc": user_arc.get("current_arc"),
                "phase": current_phase,
                "achieved_at": datetime.now(timezone.utc).isoformat(),
                "stats_at_time": stats.copy(),
                "milestone": progression["milestone"]
            }
            
            await db.user_arcs.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "current_arc": progression["next_arc"],
                        "current_phase": progression["next_phase"],
                        "arc_progress": 0,
                        "last_updated": datetime.now(timezone.utc)
                    },
                    "$push": {"arc_history": arc_history_entry}
                }
            )
            
            # Emit arc progression event to all user's active connections
            await emit_arc_progression(user_id, progression["next_arc"], progression["next_phase"])
            
            break

async def check_redemption_arc(user_id: str, user_arc: dict):
    """Check if user qualifies for Redemption Arc (returned after 7+ days)"""
    last_updated = user_arc.get("last_updated")
    if not last_updated:
        return
    
    # Convert to datetime if it's a string
    if isinstance(last_updated, str):
        last_updated = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
    
    # Ensure last_updated is timezone-aware
    if last_updated.tzinfo is None:
        last_updated = last_updated.replace(tzinfo=timezone.utc)
    
    # Check if user was away for 7+ days and is now active
    days_away = (datetime.now(timezone.utc) - last_updated).days
    current_phase = user_arc.get("current_phase", "prologue")
    
    # Only trigger redemption arc if they were away for 7+ days and have progressed beyond prologue
    if days_away >= 7 and current_phase != "prologue" and current_phase != "redemption":
        # Update to Redemption Arc
        arc_history_entry = {
            "arc": user_arc.get("current_arc"),
            "phase": current_phase,
            "achieved_at": datetime.now(timezone.utc).isoformat(),
            "stats_at_time": user_arc.get("stats", {}),
            "milestone": "redemption_return",
            "days_away": days_away
        }
        
        await db.user_arcs.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "current_arc": f"🌅 Redemption Arc: Returned After {days_away} Days",
                    "current_phase": "redemption",
                    "arc_progress": 0,
                    "last_updated": datetime.now(timezone.utc)
                },
                "$push": {"arc_history": arc_history_entry}
            }
        )
        
        # Emit redemption arc progression
        await emit_arc_progression(user_id, f"🌅 Redemption Arc: Returned After {days_away} Days", "redemption")

async def emit_arc_progression(user_id: str, new_arc: str, phase: str):
    """Emit arc progression to all user's active connections"""
    # Find user in active matches
    user_sids = []
    for sid, info in active_matches.items():
        if info.get('user_id') == user_id:
            user_sids.append(sid)
    
    # Find user in episode rooms
    for sid, info in episode_room_users.items():
        if info.get('user_id') == user_id:
            user_sids.append(sid)
    
    # Emit to all found connections
    for sid in user_sids:
        await sio.emit('arc_progression', {
            'new_arc': new_arc,
            'phase': phase,
            'user_id': user_id
        }, room=sid)

# Arc System API Endpoints
@api_router.get("/user/arc")
async def get_user_arc(request: Request):
    """Get current user's arc information"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    user_arc = await db.user_arcs.find_one({"user_id": user.id}, {"_id": 0})
    if not user_arc:
        user_arc = await initialize_user_arc(user.id)
    
    return user_arc

@api_router.get("/user/arc/milestones")
async def get_arc_milestones(request: Request):
    """Get available arc milestones and user's progress"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    user_arc = await db.user_arcs.find_one({"user_id": user.id}, {"_id": 0})
    if not user_arc:
        user_arc = await initialize_user_arc(user.id)
    
    stats = user_arc.get("stats", {})
    current_phase = user_arc.get("current_phase", "prologue")
    
    # Define anime-style milestones with progress
    milestones = [
        {
            "name": "First Match",
            "description": "Find your first anime soulmate",
            "emoji": "⚡",
            "phase": "prologue",
            "arc_unlock": "Connection Arc",
            "progress": min(100, (stats.get("matches_completed", 0) / 1) * 100),
            "completed": stats.get("matches_completed", 0) >= 1,
            "current": stats.get("matches_completed", 0),
            "target": 1
        },
        {
            "name": "Rising Bond",
            "description": "Share 100 heartfelt messages",
            "emoji": "🔥",
            "phase": "connection",
            "arc_unlock": "Rising Bond Arc",
            "progress": min(100, (stats.get("messages_sent", 0) / 100) * 100),
            "completed": stats.get("messages_sent", 0) >= 100,
            "current": stats.get("messages_sent", 0),
            "target": 100
        },
        {
            "name": "Adventure Seeker",
            "description": "Explore 5 episode rooms",
            "emoji": "🌟",
            "phase": "rising_bond",
            "arc_unlock": "Adventure Arc",
            "progress": min(100, (stats.get("episode_rooms_joined", 0) / 5) * 100),
            "completed": stats.get("episode_rooms_joined", 0) >= 5,
            "current": stats.get("episode_rooms_joined", 0),
            "target": 5
        },
        {
            "name": "Social Butterfly",
            "description": "Make 3 friends and send 250 messages",
            "emoji": "👑",
            "phase": "adventure",
            "arc_unlock": "Power Arc",
            "progress": min(100, ((stats.get("friends_count", 0) / 3) + (stats.get("messages_sent", 0) / 250)) * 50),
            "completed": stats.get("friends_count", 0) >= 3 and stats.get("messages_sent", 0) >= 250,
            "current": {"friends": stats.get("friends_count", 0), "messages": stats.get("messages_sent", 0)},
            "target": {"friends": 3, "messages": 250}
        },
        {
            "name": "Master Connector",
            "description": "Build a network of 10 friends and explore 20 rooms",
            "emoji": "🌙",
            "phase": "power",
            "arc_unlock": "Eclipse Arc",
            "progress": min(100, ((stats.get("friends_count", 0) / 10) + (stats.get("episode_rooms_joined", 0) / 20)) * 50),
            "completed": stats.get("friends_count", 0) >= 10 and stats.get("episode_rooms_joined", 0) >= 20,
            "current": {"friends": stats.get("friends_count", 0), "rooms": stats.get("episode_rooms_joined", 0)},
            "target": {"friends": 10, "rooms": 20}
        },
        {
            "name": "Redemption Return",
            "description": "Return after being away for 7+ days",
            "emoji": "🌅",
            "phase": "special",
            "arc_unlock": "Redemption Arc",
            "progress": 100 if current_phase == "redemption" else 0,
            "completed": current_phase == "redemption",
            "current": "Special milestone",
            "target": "Return after 7+ days away"
        }
    ]
    
    return {
        "current_arc": user_arc.get("current_arc"),
        "current_phase": current_phase,
        "milestones": milestones,
        "stats": stats,
        "arc_history": user_arc.get("arc_history", [])
    }

# Passport System API Endpoints
@api_router.get("/passport")
async def get_user_passport(request: Request):
    """Get user's anime passport"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Get or create passport
    passport = await db.anime_passports.find_one({"user_id": user.id}, {"_id": 0})
    if not passport:
        # Create new passport
        passport_obj = AnimePassport(user_id=user.id)
        passport_dict = passport_obj.dict()
        passport_dict['created_at'] = passport_dict['created_at'].isoformat()
        passport_dict['last_updated'] = passport_dict['last_updated'].isoformat()
        await db.anime_passports.insert_one(passport_dict)
        passport = passport_dict
    
    # Get passport stats
    stats = await db.passport_stats.find_one({"user_id": user.id}, {"_id": 0})
    if not stats:
        stats_obj = PassportStats(user_id=user.id)
        stats_dict = stats_obj.dict()
        stats_dict['last_updated'] = stats_dict['last_updated'].isoformat()
        await db.passport_stats.insert_one(stats_dict)
        stats = stats_dict
    
    # Get user badges
    user_badges = await db.user_passport_badges.find({"user_id": user.id}, {"_id": 0}).to_list(100)
    badge_ids = [ub['badge_id'] for ub in user_badges]
    badges = await db.passport_badges.find({"id": {"$in": badge_ids}}, {"_id": 0}).to_list(100)
    
    # Get journey data
    journey = await db.passport_journeys.find_one({"user_id": user.id}, {"_id": 0})
    
    return {
        "passport": passport,
        "stats": stats,
        "badges": badges,
        "journey": journey,
        "anime_vibes": ANIME_VIBES
    }

@api_router.put("/passport")
async def update_passport(passport_data: dict, request: Request):
    """Update user's passport data"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Validate and update passport
    update_data = {}
    
    if 'top_5_anime' in passport_data:
        update_data['top_5_anime'] = passport_data['top_5_anime'][:5]  # Limit to 5
    
    if 'top_3_characters' in passport_data:
        update_data['top_3_characters'] = passport_data['top_3_characters'][:3]  # Limit to 3
    
    if 'anime_vibe' in passport_data and passport_data['anime_vibe'] in ANIME_VIBES:
        update_data['anime_vibe'] = passport_data['anime_vibe']
    
    if update_data:
        update_data['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        # Recalculate fate number if preferences changed
        if 'top_5_anime' in update_data or 'anime_vibe' in update_data:
            stats = await db.passport_stats.find_one({"user_id": user.id}, {"_id": 0})
            if stats:
                stats_obj = PassportStats(**stats)
                user_data = {
                    'favorite_anime': [anime['title'] for anime in update_data.get('top_5_anime', [])],
                    'anime_vibe': update_data.get('anime_vibe', 'Wholesome')
                }
                fate_number, breakdown = calculate_fate_number(user_data, stats_obj)
                update_data['fate_number'] = fate_number
                update_data['fate_number_breakdown'] = breakdown
        
        await db.anime_passports.update_one(
            {"user_id": user.id},
            {"$set": update_data},
            upsert=True
        )
    
    return {"message": "Passport updated successfully"}

@api_router.get("/passport/badges")
async def get_available_badges(request: Request):
    """Get all available badges and user's progress"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Get all badges
    all_badges = await db.passport_badges.find({}, {"_id": 0}).to_list(100)
    
    # Get user's earned badges
    user_badges = await db.user_passport_badges.find({"user_id": user.id}, {"_id": 0}).to_list(100)
    earned_badge_ids = {ub['badge_id'] for ub in user_badges}
    
    # Get user stats for progress calculation
    stats = await db.passport_stats.find_one({"user_id": user.id}, {"_id": 0})
    if not stats:
        stats = PassportStats(user_id=user.id).dict()
    
    # Calculate progress for each badge
    badges_with_progress = []
    for badge in all_badges:
        badge_progress = badge.copy()
        badge_progress['earned'] = badge['id'] in earned_badge_ids
        badge_progress['earned_at'] = None
        
        # Find earned date if applicable
        for user_badge in user_badges:
            if user_badge['badge_id'] == badge['id']:
                badge_progress['earned_at'] = user_badge['earned_at']
                break
        
        # Calculate progress based on unlock condition
        condition = badge['unlock_condition']
        progress = 0
        
        for key, target_value in condition.items():
            if key in stats:
                current_value = stats[key]
                if isinstance(target_value, (int, float)):
                    progress = min(100, (current_value / target_value) * 100)
                else:
                    progress = 100 if current_value >= target_value else 0
                break
        
        badge_progress['progress'] = progress
        badges_with_progress.append(badge_progress)
    
    return badges_with_progress

@api_router.get("/passport/journey")
async def get_passport_journey(request: Request):
    """Get user's passport journey timeline"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Get or create journey
    journey = await db.passport_journeys.find_one({"user_id": user.id}, {"_id": 0})
    if not journey:
        journey_obj = PassportJourney(
            user_id=user.id,
            joined_date=user.created_at if hasattr(user, 'created_at') else datetime.now(timezone.utc)
        )
        journey_dict = journey_obj.dict()
        journey_dict['joined_date'] = journey_dict['joined_date'].isoformat() if isinstance(journey_dict['joined_date'], datetime) else journey_dict['joined_date']
        journey_dict['created_at'] = journey_dict['created_at'].isoformat()
        journey_dict['last_updated'] = journey_dict['last_updated'].isoformat()
        
        # Set optional datetime fields
        for field in ['first_match_date', 'first_episode_room_date', 'first_friend_date', 'first_streak_date']:
            if journey_dict[field]:
                journey_dict[field] = journey_dict[field].isoformat() if isinstance(journey_dict[field], datetime) else journey_dict[field]
        
        await db.passport_journeys.insert_one(journey_dict)
        journey = journey_dict
    
    # Get episode room visits for map
    room_visits = await db.episode_room_visits.find({"user_id": user.id}, {"_id": 0}).to_list(100)
    
    return {
        "journey": journey,
        "episode_room_map": room_visits
    }

@api_router.get("/passport/levels")
async def get_passport_levels(request: Request):
    """Get passport level system information"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Get passport for current level info
    passport = await db.anime_passports.find_one({"user_id": user.id}, {"_id": 0})
    if not passport:
        return {"levels": PASSPORT_LEVELS, "current_level": 1, "current_experience": 0}
    
    level_info = get_passport_level_info(passport.get('total_experience', 0))
    
    return {
        "levels": PASSPORT_LEVELS,
        "current_level": level_info['level'],
        "current_level_name": level_info['name'],
        "current_experience": passport.get('total_experience', 0),
        "experience_to_next": level_info['experience_to_next']
    }

@api_router.post("/passport/share")
async def generate_share_card(request: Request):
    """Generate shareable passport card data"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Get passport data
    passport = await db.anime_passports.find_one({"user_id": user.id}, {"_id": 0})
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found")
    
    # Get user badges count
    badges_count = await db.user_passport_badges.count_documents({"user_id": user.id})
    
    # Create shareable card data
    share_card = {
        "user_name": user.name,
        "user_picture": user.picture,
        "top_anime": passport.get('top_5_anime', [])[:3],  # Show top 3 for sharing
        "anime_vibe": passport.get('anime_vibe', 'Wholesome'),
        "fate_number": passport.get('fate_number', 0),
        "passport_level": passport.get('passport_level', 1),
        "passport_level_name": passport.get('passport_level_name', 'Rookie Fan'),
        "badges_count": badges_count,
        "favorite_character": passport.get('top_3_characters', [{}])[0] if passport.get('top_3_characters') else None,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    
    return share_card

# Helper function to initialize passport system for existing users
async def initialize_passport_system():
    """Initialize passport system with default badges"""
    # Create default badges if they don't exist
    existing_badges = await db.passport_badges.count_documents({})
    if existing_badges == 0:
        badge_docs = []
        for badge_data in DEFAULT_BADGES:
            badge = PassportBadge(**badge_data)
            badge_dict = badge.dict()
            badge_dict['created_at'] = badge_dict['created_at'].isoformat()
            badge_docs.append(badge_dict)
        
        await db.passport_badges.insert_many(badge_docs)
        logging.info(f"Initialized {len(badge_docs)} default badges")

# Helper function to update passport stats
async def update_passport_stats(user_id: str, stat_updates: dict):
    """Update passport statistics and check for badge unlocks"""
    # Separate numeric and non-numeric updates
    inc_ops = {}
    set_ops = {}
    
    for stat, value in stat_updates.items():
        if isinstance(value, (int, float)):
            inc_ops[stat] = value
        else:
            set_ops[stat] = value
    
    # Always set the last_updated timestamp
    set_ops['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    # Build the update operation
    update_operation = {}
    if inc_ops:
        update_operation["$inc"] = inc_ops
    if set_ops:
        update_operation["$set"] = set_ops
    
    # If no operations, just set the timestamp
    if not update_operation:
        update_operation = {"$set": {"last_updated": datetime.now(timezone.utc).isoformat()}}
    
    await db.passport_stats.update_one(
        {"user_id": user_id},
        update_operation,
        upsert=True
    )
    
    # Check for badge unlocks
    await check_badge_unlocks(user_id)

async def check_badge_unlocks(user_id: str):
    """Check if user has unlocked any new badges"""
    try:
        # Get user stats
        stats = await db.passport_stats.find_one({"user_id": user_id}, {"_id": 0})
        if not stats:
            return
        
        # Get user's current badges
        user_badges = await db.user_passport_badges.find({"user_id": user_id}, {"_id": 0}).to_list(100)
        earned_badge_ids = {ub['badge_id'] for ub in user_badges}
        
        # Get all available badges
        all_badges = await db.passport_badges.find({}, {"_id": 0}).to_list(100)
        
        # Check each badge
        for badge in all_badges:
            if badge['id'] in earned_badge_ids:
                continue  # Already earned
            
            # Check unlock condition
            condition = badge['unlock_condition']
            unlocked = True
            
            for key, target_value in condition.items():
                current_value = stats.get(key, 0)
                if isinstance(target_value, (int, float)):
                    if current_value < target_value:
                        unlocked = False
                        break
                else:
                    if current_value != target_value:
                        unlocked = False
                        break
            
            if unlocked:
                # Award badge
                user_badge = UserPassportBadge(
                    user_id=user_id,
                    badge_id=badge['id'],
                    progress_when_earned=stats.copy()
                )
                user_badge_dict = user_badge.dict()
                user_badge_dict['earned_at'] = user_badge_dict['earned_at'].isoformat()
                
                await db.user_passport_badges.insert_one(user_badge_dict)
                
                # Add experience to passport
                await db.anime_passports.update_one(
                    {"user_id": user_id},
                    {"$inc": {"total_experience": badge['experience_reward']}},
                    upsert=True
                )
                
                # Update passport level if needed
                passport = await db.anime_passports.find_one({"user_id": user_id}, {"_id": 0})
                if passport:
                    level_info = get_passport_level_info(passport.get('total_experience', 0))
                    await db.anime_passports.update_one(
                        {"user_id": user_id},
                        {"$set": {
                            "passport_level": level_info['level'],
                            "passport_level_name": level_info['name'],
                            "experience_to_next_level": level_info['experience_to_next']
                        }}
                    )
                
                logging.info(f"User {user_id} earned badge: {badge['name']}")
    except Exception as e:
        logging.error(f"Error checking badge unlocks for user {user_id}: {e}")

# Track episode room visits for passport journey
async def track_episode_room_visit(user_id: str, room_id: str, anime_title: str, episode_number: int, visit_type: str = "visited"):
    """Track episode room visit for passport journey"""
    visit = EpisodeRoomVisit(
        user_id=user_id,
        room_id=room_id,
        anime_title=anime_title,
        episode_number=episode_number,
        visit_type=visit_type
    )
    
    visit_dict = visit.dict()
    visit_dict['visited_at'] = visit_dict['visited_at'].isoformat()
    
    await db.episode_room_visits.insert_one(visit_dict)
    
    # Update journey milestones
    journey = await db.passport_journeys.find_one({"user_id": user_id}, {"_id": 0})
    if journey:
        updates = {}
        if not journey.get('first_episode_room_date'):
            updates['first_episode_room_date'] = datetime.now(timezone.utc).isoformat()
        
        if updates:
            await db.passport_journeys.update_one(
                {"user_id": user_id},
                {"$set": updates}
            )

# Socket.IO Events
@sio.event
async def connect(sid, environ):
    logging.info(f"Client connected: {sid}")
    await sio.emit('connected', {'message': 'Connected to server', 'sid': sid}, room=sid)
    await sio.emit('connected', {'sid': sid}, room=sid)

@sio.event
async def disconnect(sid):
    global matching_queue
    
    logging.info(f"Client disconnected: {sid}")
    
    # Remove from active matches
    if sid in active_matches:
        match_info = active_matches[sid]
        partner_sid = match_info.get('partner_sid')
        
        if partner_sid and partner_sid in active_matches:
            await sio.emit('partner_disconnected', room=partner_sid)
            del active_matches[partner_sid]
        
        del active_matches[sid]
    
    # Remove from episode rooms
    if sid in episode_room_users:
        room_info = episode_room_users[sid]
        room_id = room_info['room_id']
        user_id = room_info['user_id']
        
        # Remove from cache
        if room_id in episode_rooms_cache:
            episode_rooms_cache[room_id]['users'] = [
                u for u in episode_rooms_cache[room_id]['users']
                if u['sid'] != sid
            ]
            
            current_count = len(episode_rooms_cache[room_id]['users'])
            
            # Update database
            await db.episode_rooms.update_one(
                {"id": room_id},
                {"$set": {"active_users_count": current_count}}
            )
            
            # Notify other users
            await sio.emit('episode_room_user_left', {
                'user_id': user_id,
                'active_users': current_count
            }, room=room_id)
        
        del episode_room_users[sid]
    
    # Remove from active users
    user_to_remove = None
    for user_id, data in active_users.items():
        if data['sid'] == sid:
            user_to_remove = user_id
            break
    
    if user_to_remove:
        del active_users[user_to_remove]
        # Notify all clients that this user went offline
        await sio.emit('user_offline', user_to_remove)
        
        # Send updated online users list to everyone
        online_user_ids = list(active_users.keys())
        await sio.emit('online_users_update', online_user_ids)
        logging.info(f"User {user_to_remove} went offline. Broadcasting updated list: {len(online_user_ids)} users online")
    
    # Remove from matching queue
    matching_queue = [u for u in matching_queue if u['sid'] != sid]

@sio.event
async def join_matching(sid, data):
    try:
        user_id = data.get('user_id')
        user_data = data.get('user_data')
        
        logging.info(f"Join matching request from {user_id}, sid: {sid}")
        
        if not user_id:
            logging.error("No user_id provided in join_matching")
            await sio.emit('error', {'message': 'User ID required'}, room=sid)
            return
        
        # Get user from database or use provided data
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            # If user not found in database, use provided user_data for testing
            if user_data:
                logging.info(f"User not found in DB, using provided data for: {user_id}")
                user = User(**user_data)
                # Optionally create the user in database for future use
                user_dict = user.dict()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.users.insert_one(user_dict)
                logging.info(f"Created test user in database: {user.name}")
            else:
                logging.error(f"User not found and no user_data provided: {user_id}")
                await sio.emit('error', {'message': 'User not found'}, room=sid)
                return
        else:
            # User found in DB - but update with latest user_data if provided (for anonymous users)
            if user_data:
                logging.info(f"Updating user {user_id} with fresh data from client")
                # Merge database data with client data (client data takes precedence for interests)
                merged_data = {**user_doc, **user_data}
                user = User(**merged_data)
                # Update database with latest data
                update_dict = user.dict()
                update_dict['created_at'] = update_dict['created_at'].isoformat() if isinstance(update_dict['created_at'], datetime) else update_dict['created_at']
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": update_dict}
                )
                logging.info(f"Updated user in database: {user.name}, anime: {len(user.favorite_anime)}, genres: {len(user.favorite_genres)}, themes: {len(user.favorite_themes)}")
            else:
                user = User(**user_doc)
        logging.info(f"User loaded: {user.name}, anime count: {len(user.favorite_anime)}, genres: {len(user.favorite_genres)}, themes: {len(user.favorite_themes)}")
        
        # Check premium limits for daily matches
        today = datetime.now(timezone.utc).date()
        daily_matches_count = await db.user_daily_stats.count_documents({
            "user_id": user_id,
            "date": today.isoformat(),
            "action": "match_started"
        })
        
        can_match = await check_premium_limit(user_id, "daily_matches", daily_matches_count)
        if not can_match:
            premium_status = await get_user_premium_status(user_id)
            max_matches = premium_status["features"]["max_daily_matches"]
            await sio.emit('premium_limit_reached', {
                'message': f'Daily match limit reached ({max_matches}). Upgrade to premium for more matches!',
                'feature': 'daily_matches',
                'current_count': daily_matches_count,
                'max_count': max_matches
            }, room=sid)
            return
        
        # Add to active users
        user_dict = user.dict()
        user_dict['created_at'] = user_dict['created_at'].isoformat() if isinstance(user_dict['created_at'], datetime) else user_dict['created_at']
        active_users[user_id] = {'sid': sid, 'user_data': user_dict}
        
        # Notify all clients that this user came online
        await sio.emit('user_online', user_id)
        
        # Send updated online users list to everyone (including the new user)
        online_user_ids = list(active_users.keys())
        await sio.emit('online_users_update', online_user_ids)
        logging.info(f"Broadcasting online users list: {len(online_user_ids)} users online")
        
        # Declare global variables at the start
        global matching_queue
        
        # Check if there's someone in the queue
        logging.info(f"Current matching queue size: {len(matching_queue)}")
        logging.info(f"Queue contents: {[u['user_data']['name'] for u in matching_queue]}")
        
        if matching_queue:
            # Find best match with improved algorithm
            match_result = await find_best_match(user, matching_queue)
            logging.info(f"Match result: {match_result}")
            
            if match_result:
                best_match = match_result['match']
                best_score = match_result['score']
                match_type = match_result['type']  # 'interest_based' or 'random'
                
                logging.info(f"Found match: {user.name} <-> {best_match['user_data']['name']} (type: {match_type}, score: {best_score})")
                
                # Remove from queue
                original_queue_size = len(matching_queue)
                matching_queue = [u for u in matching_queue if u['sid'] != best_match['sid']]
                logging.info(f"Removed matched user from queue. Size: {original_queue_size} -> {len(matching_queue)}")
                
                # Broadcast queue update to remaining users
                await broadcast_queue_update()
                
                # Create match
                partner_sid = best_match['sid']
                partner_data = best_match['user_data']
                
                active_matches[sid] = {
                    'partner_sid': partner_sid,
                    'user_id': user_id,
                    'partner_id': partner_data['id'],
                    'compatibility': best_score,
                    'match_type': match_type
                }
                
                active_matches[partner_sid] = {
                    'partner_sid': sid,
                    'user_id': partner_data['id'],
                    'partner_id': user_id,
                    'compatibility': best_score,
                    'match_type': match_type
                }
                
                # Track daily stats for both users
                await track_daily_stat(user_id, "match_started")
                await track_daily_stat(partner_data['id'], "match_started")
                
                # Update passport stats for matches
                try:
                    await update_passport_stats(user_id, {"total_matches": 1})
                    await update_passport_stats(partner_data['id'], {"total_matches": 1})
                except Exception as e:
                    logging.error(f"Error updating passport stats for match: {e}")
                
                # Update arc progression for both users (first match milestone)
                await update_user_stats(user_id, "matches_completed", 1)
                await update_user_stats(partner_data['id'], "matches_completed", 1)
                
                # Calculate shared anime universe
                partner_user_obj = User(**partner_data)
                shared_universe = calculate_shared_universe(user, partner_user_obj)
                
                # Add match type info to shared universe
                shared_universe['match_type'] = match_type
                if match_type == 'great_match':
                    shared_universe['match_message'] = f"🌟 Amazing match! You both have incredible anime compatibility! (Compatibility: {best_score}%)"
                elif match_type == 'good_match':
                    shared_universe['match_message'] = f"✨ Great match! You both love similar anime! (Compatibility: {best_score}%)"
                elif match_type == 'interest_based':
                    shared_universe['match_message'] = f"👍 Nice match! You have some shared interests! (Compatibility: {best_score}%)"
                else:
                    shared_universe['match_message'] = "Connected with a fellow anime fan! Let's chat! 🌟"
                
                # Always provide good conversation starters for random matches
                if not shared_universe.get('conversation_starters'):
                    shared_universe['conversation_starters'] = [
                        "What anime are you currently watching?",
                        "What got you into anime?",
                        "Any anime recommendations for me?"
                    ]
                
                # Notify both users with shared universe data
                await sio.emit('match_found', {
                    'partner': partner_data,
                    'compatibility': best_score,
                    'shared_universe': shared_universe
                }, room=sid)
                
                user_dict_emit = user.dict()
                user_dict_emit['created_at'] = user_dict_emit['created_at'].isoformat() if isinstance(user_dict_emit['created_at'], datetime) else user_dict_emit['created_at']
                await sio.emit('match_found', {
                    'partner': user_dict_emit,
                    'compatibility': best_score,
                    'shared_universe': shared_universe
                }, room=partner_sid)
                
                logging.info(f"Match created: {user.name} <-> {partner_data['name']} (type: {match_type}, score: {best_score})")
        else:
            # Add to queue
            user_dict_queue = user.dict()
            user_dict_queue['created_at'] = user_dict_queue['created_at'].isoformat() if isinstance(user_dict_queue['created_at'], datetime) else user_dict_queue['created_at']
            matching_queue.append({
                'sid': sid,
                'user_id': user_id,
                'user_data': user_dict_queue
            })
            logging.info(f"Added user {user.name} to matching queue. Queue size: {len(matching_queue)}")
            
            # Send matching stats to user
            await send_matching_stats(sid)
            
            # Broadcast queue update to all users in queue
            await broadcast_queue_update()
            
            await sio.emit('searching', room=sid)
    except Exception as e:
        logging.error(f"Error in join_matching: {e}", exc_info=True)
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def send_message(sid, data):
    try:
        if sid not in active_matches:
            await sio.emit('error', {'message': 'Not in an active chat'}, room=sid)
            return
        
        match_info = active_matches[sid]
        partner_sid = match_info['partner_sid']
        message = data.get('message', '')
        image = data.get('image', None)  # Get image data if present
        
        # DEBUG: Log received data
        logging.info(f"Received message from {sid}: message='{message}', has_image={image is not None}")
        if image:
            logging.info(f"Image data length: {len(image)} characters")
        
        # Validate image size if present
        if image:
            # Rough estimate: base64 is ~33% larger than binary
            image_size = len(image) * 0.75 / (1024 * 1024)  # Size in MB
            logging.info(f"Image size: {image_size:.2f}MB")
            if image_size > 5:  # 5MB limit
                await sio.emit('error', {'message': 'Image too large. Maximum 5MB.'}, room=sid)
                logging.warning(f"Image too large: {image_size:.2f}MB from user {match_info['user_id']}")
                return
        
        # Simple spoiler detection (rule-based)
        spoiler_keywords = ['dies', 'killed', 'death', 'ending', 'finale', 'spoiler']
        is_spoiler = any(keyword in message.lower() for keyword in spoiler_keywords)
        
        message_data = {
            'message': message,
            'from': match_info['user_id'],
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'is_spoiler': is_spoiler,
            'image': image  # Include image in message data
        }
        
        # DEBUG: Log message_data being sent
        logging.info(f"Preparing to send message_data with image={message_data.get('image') is not None}")
        
        # PRIVACY: Do NOT save random match messages to database
        # Only real-time transmission for ephemeral privacy
        # Messages vanish when users skip/leave - no permanent records
        logging.info(f"Random match message - NOT saved to database (privacy feature)")
        
        # Send to partner
        try:
            await sio.emit('receive_message', message_data, room=partner_sid)
            logging.info(f"Message sent to partner {partner_sid}, has_image: {image is not None}, image_in_data: {message_data.get('image') is not None}")
        except Exception as e:
            logging.error(f"Error sending message to partner: {e}")
            await sio.emit('error', {'message': 'Failed to send message to partner'}, room=sid)
            return
        
        # Echo back to sender
        await sio.emit('message_sent', message_data, room=sid)
        logging.info(f"Message echoed back to sender {sid}, has_image: {message_data.get('image') is not None}")
        
        # Update passport stats for messages sent
        try:
            await update_passport_stats(match_info['user_id'], {"messages_sent": 1})
        except Exception as e:
            logging.error(f"Error updating passport stats for message: {e}")
        
        # Update arc progression for message sender
        await update_user_stats(match_info['user_id'], "messages_sent", 1)
        
    except Exception as e:
        logging.error(f"Error in send_message: {e}", exc_info=True)
        await sio.emit('error', {'message': 'Failed to send message'}, room=sid)
@sio.event
async def typing_start(sid, data):
    """Handle when a user starts typing"""
    if sid not in active_matches:
        return
    
    match_info = active_matches[sid]
    partner_sid = match_info['partner_sid']
    
    # Get user data to send partner's name
    user_id = match_info['user_id']
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc:
        user = User(**user_doc)
        await sio.emit('partner_typing_start', {
            'user_name': user.name,
            'user_id': user_id
        }, room=partner_sid)

@sio.event
async def typing_stop(sid, data):
    """Handle when a user stops typing"""
    if sid not in active_matches:
        return
    
    match_info = active_matches[sid]
    partner_sid = match_info['partner_sid']
    
    await sio.emit('partner_typing_stop', room=partner_sid)

@sio.event
async def send_friend_request_event(sid, data):
    if sid not in active_matches:
        return
    
    match_info = active_matches[sid]
    partner_sid = match_info['partner_sid']
    
    await sio.emit('friend_request_received', {
        'from_user_id': match_info['user_id']
    }, room=partner_sid)


@sio.event
async def leave_chat(sid):
    if sid in active_matches:
        match_info = active_matches[sid]
        partner_sid = match_info.get('partner_sid')
        
        # Save chat history if they're friends
        # (Simplified - in production, you'd save the actual messages)
        
        if partner_sid and partner_sid in active_matches:
            await sio.emit('partner_left', room=partner_sid)
            del active_matches[partner_sid]
        
        # Use safe deletion to avoid KeyError
        active_matches.pop(sid, None)
        await sio.emit('chat_ended', room=sid)

@sio.event
async def skip_partner(sid):
    """Handle partner skip - continue matching automatically"""
    if sid in active_matches:
        match_info = active_matches[sid]
        partner_sid = match_info.get('partner_sid')
        user_id = match_info['user_id']
        
        # Notify partner they were skipped
        if partner_sid and partner_sid in active_matches:
            await sio.emit('you_were_skipped', room=partner_sid)
            # Safely remove partner from active matches
            active_matches.pop(partner_sid, None)
        
        # Safely remove current user from active matches
        active_matches.pop(sid, None)
        
        # Get user data for re-matching
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user_doc:
            user = User(**user_doc)
            user_dict = user.dict()
            user_dict['created_at'] = user_dict['created_at'].isoformat() if isinstance(user_dict['created_at'], datetime) else user_dict['created_at']
            
            # Add back to matching queue
            matching_queue.append({
                'sid': sid,
                'user_id': user_id,
                'user_data': user_dict
            })
            
            # Send matching stats
            await send_matching_stats(sid)
            
            # Broadcast queue update to all searching users
            await broadcast_queue_update()
            
            await sio.emit('searching', room=sid)
            
            # Try to find immediate match
            await try_immediate_match(sid, user)

@sio.event
async def cancel_matching(sid):
    """Handle canceling the matching process"""
    try:
        global matching_queue
        # Remove from matching queue
        original_size = len(matching_queue)
        matching_queue = [u for u in matching_queue if u['sid'] != sid]
        logging.info(f"Removed user from matching queue. Queue size: {original_size} -> {len(matching_queue)}")
        
        # Broadcast queue update to remaining users
        await broadcast_queue_update()
        
        # Remove from active matches if somehow still there
        if sid in active_matches:
            match_info = active_matches[sid]
            partner_sid = match_info.get('partner_sid')
            
            if partner_sid and partner_sid in active_matches:
                await sio.emit('partner_left', room=partner_sid)
                del active_matches[partner_sid]
            
            del active_matches[sid]
        
        await sio.emit('matching_cancelled', room=sid)
        
    except Exception as e:
        logging.error(f"Error in cancel_matching: {e}", exc_info=True)

async def send_matching_stats(sid):
    """Send current matching statistics to user"""
    stats = {
        'activeMatchers': len(matching_queue),
        'totalUsers': len(active_users),
        'avgWaitTime': 30  # Placeholder - could calculate real average
    }
    await sio.emit('matching_stats', stats, room=sid)

async def broadcast_queue_update():
    """Broadcast queue size update to all users in the matching queue"""
    if not matching_queue:
        return
    
    stats = {
        'activeMatchers': len(matching_queue),
        'totalUsers': len(active_users)
    }
    
    # Send to all users currently in the queue
    for queued_user in matching_queue:
        await sio.emit('matching_stats', stats, room=queued_user['sid'])
    
    logging.info(f"Broadcasted queue update: {len(matching_queue)} users searching")

@api_router.get("/debug/queue")
async def get_queue_status(request: Request):
    """Debug endpoint to check matching queue status"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    return {
        'queue_size': len(matching_queue),
        'queue_users': [{'name': u['user_data']['name'], 'sid': u['sid']} for u in matching_queue],
        'active_matches': len(active_matches),
        'active_users': len(active_users)
    }

@api_router.post("/debug/clear-queue")
async def clear_matching_queue(request: Request):
    """Debug endpoint to clear the matching queue"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    global matching_queue, active_matches, active_users
    
    old_queue_size = len(matching_queue)
    old_matches_size = len(active_matches)
    old_users_size = len(active_users)
    
    matching_queue.clear()
    active_matches.clear()
    active_users.clear()
    
    return {
        'message': 'Matching queue and active connections cleared',
        'cleared': {
            'queue_size': old_queue_size,
            'active_matches': old_matches_size,
            'active_users': old_users_size
        }
    }

# Matching configuration constants
MIN_COMPATIBILITY_THRESHOLD = 15  # Minimum score for interest-based matching
GOOD_MATCH_THRESHOLD = 30  # Score for a good interest-based match
GREAT_MATCH_THRESHOLD = 50  # Score for a great interest-based match

async def find_best_match(user, queue):
    """
    Enhanced matching algorithm that prioritizes interest-based matches but falls back to random matching.
    Priority:
    1. Great matches (50%+ compatibility)
    2. Good matches (30%+ compatibility)
    3. Decent matches (15%+ compatibility)
    4. Random match if no interest overlap
    """
    if not queue:
        logging.info("No users in queue for matching")
        return None
    
    # Filter out the current user from the queue to prevent self-matching
    filtered_queue = [q for q in queue if q['user_data']['id'] != user.id]
    
    if not filtered_queue:
        logging.info("No other users in queue for matching (only self)")
        return None
    
    logging.info(f"Finding best match for user {user.name} from queue of {len(filtered_queue)} users")
    logging.info(f"User {user.name} preferences: anime={user.favorite_anime[:3] if len(user.favorite_anime) > 3 else user.favorite_anime}, genres={user.favorite_genres[:3] if len(user.favorite_genres) > 3 else user.favorite_genres}")
    
    # Log what type of matching will be prioritized
    if user.favorite_genres:
        logging.info(f"User {user.name} has {len(user.favorite_genres)} genre interests: {user.favorite_genres}")
    if user.favorite_anime:
        logging.info(f"User {user.name} has {len(user.favorite_anime)} favorite anime: {user.favorite_anime}")
    
    # Categorize potential matches by compatibility
    great_matches = []  # 50%+
    good_matches = []   # 30-49%
    decent_matches = [] # 15-29%
    low_matches = []    # <15%
    
    # Evaluate all potential matches
    for queued_user in filtered_queue:
        queued_user_obj = User(**queued_user['user_data'])
        compatibility_score = calculate_compatibility(user, queued_user_obj)
        
        # Log shared interests for debugging
        shared_genres = set(user.favorite_genres) & set(queued_user_obj.favorite_genres)
        if shared_genres:
            logging.info(f"  → {user.name} & {queued_user_obj.name} share genres: {list(shared_genres)}")
        
        match_data = {
            'queued_user': queued_user,
            'score': compatibility_score,
            'user_obj': queued_user_obj
        }
        
        if compatibility_score >= GREAT_MATCH_THRESHOLD:
            great_matches.append(match_data)
            logging.info(f"🌟 GREAT match: {user.name} <-> {queued_user_obj.name}: {compatibility_score}%")
        elif compatibility_score >= GOOD_MATCH_THRESHOLD:
            good_matches.append(match_data)
            logging.info(f"✨ GOOD match: {user.name} <-> {queued_user_obj.name}: {compatibility_score}%")
        elif compatibility_score >= MIN_COMPATIBILITY_THRESHOLD:
            decent_matches.append(match_data)
            logging.info(f"👍 Decent match: {user.name} <-> {queued_user_obj.name}: {compatibility_score}%")
        else:
            low_matches.append(match_data)
            logging.info(f"🎲 Low compatibility: {user.name} <-> {queued_user_obj.name}: {compatibility_score}%")
    
    # Select the best available match
    selected_match = None
    match_type = 'random'
    
    if great_matches:
        # Pick the best great match
        selected_match = max(great_matches, key=lambda x: x['score'])
        match_type = 'great_match'
        logging.info(f"🌟 Selected GREAT match: {selected_match['score']}% compatibility")
    elif good_matches:
        # Pick the best good match
        selected_match = max(good_matches, key=lambda x: x['score'])
        match_type = 'good_match'
        logging.info(f"✨ Selected GOOD match: {selected_match['score']}% compatibility")
    elif decent_matches:
        # Pick the best decent match
        selected_match = max(decent_matches, key=lambda x: x['score'])
        match_type = 'interest_based'
        logging.info(f"👍 Selected DECENT match: {selected_match['score']}% compatibility")
    else:
        # Random matching - pick anyone from low matches
        if low_matches:
            selected_match = random.choice(low_matches)
            match_type = 'random'
            logging.info(f"🎲 Selected RANDOM match: {selected_match['score']}% compatibility")
        else:
            # Fallback to any user in queue
            queued_user = random.choice(filtered_queue)
            queued_user_obj = User(**queued_user['user_data'])
            selected_match = {
                'queued_user': queued_user,
                'score': random.randint(5, 15),
                'user_obj': queued_user_obj
            }
            match_type = 'random'
            logging.info(f"🎲 Fallback RANDOM match")
    
    if not selected_match:
        logging.warning("No match could be selected")
        return None
    
    logging.info(f"FINAL MATCH: {user.name} <-> {selected_match['user_obj'].name} (type: {match_type}, score: {selected_match['score']}%)")
    
    return {
        'match': selected_match['queued_user'],
        'score': selected_match['score'],
        'type': match_type
    }

async def try_immediate_match(sid, user):
    """Try to find an immediate match for a user"""
    global matching_queue
    
    if not matching_queue:
        return
    
    # Use the new matching algorithm
    match_result = await find_best_match(user, matching_queue)
    
    if match_result:
        best_match = match_result['match']
        best_score = match_result['score']
        match_type = match_result['type']
        
        # Remove both users from queue
        matching_queue = [u for u in matching_queue if u['sid'] not in [sid, best_match['sid']]]
        
        # Create match
        partner_sid = best_match['sid']
        partner_data = best_match['user_data']
        user_id = user.id
        
        active_matches[sid] = {
            'partner_sid': partner_sid,
            'user_id': user_id,
            'partner_id': partner_data['id'],
            'compatibility': best_score,
            'match_type': match_type
        }
        
        active_matches[partner_sid] = {
            'partner_sid': sid,
            'user_id': partner_data['id'],
            'partner_id': user_id,
            'compatibility': best_score,
            'match_type': match_type
        }
        
        # Calculate shared universe
        partner_user_obj = User(**partner_data)
        shared_universe = calculate_shared_universe(user, partner_user_obj)
        
        # Add match type info
        shared_universe['match_type'] = match_type
        if match_type == 'great_match':
            shared_universe['match_message'] = f"🌟 Amazing match! You both have incredible anime compatibility! (Compatibility: {best_score}%)"
        elif match_type == 'good_match':
            shared_universe['match_message'] = f"✨ Great match! You both love similar anime! (Compatibility: {best_score}%)"
        elif match_type == 'interest_based':
            shared_universe['match_message'] = f"👍 Nice match! You have some shared interests! (Compatibility: {best_score}%)"
        else:
            shared_universe['match_message'] = "Connected with a fellow anime fan! Let's chat! 🌟"
        
        # Always provide conversation starters
        if not shared_universe.get('conversation_starters'):
            shared_universe['conversation_starters'] = [
                "What anime are you currently watching?",
                "What got you into anime?",
                "Any anime recommendations for me?"
            ]
        
        # Notify both users
        user_dict = user.dict()
        user_dict['created_at'] = user_dict['created_at'].isoformat() if isinstance(user_dict['created_at'], datetime) else user_dict['created_at']
        
        await sio.emit('match_found', {
            'partner': partner_data,
            'compatibility': best_score,
            'shared_universe': shared_universe
        }, room=sid)
        
        await sio.emit('match_found', {
            'partner': user_dict,
            'compatibility': best_score,
            'shared_universe': shared_universe
        }, room=partner_sid)
        
        # Update passport stats for matches
        try:
            await update_passport_stats(user_id, {"total_matches": 1})
            await update_passport_stats(partner_data['id'], {"total_matches": 1})
        except Exception as e:
            logging.error(f"Error updating passport stats for immediate match: {e}")
        
        logging.info(f"Immediate match created: {user.name} <-> {partner_data['name']} (type: {match_type}, score: {best_score})")

# Episode Room Socket.IO Events
@sio.event
async def join_episode_room(sid, data):
    try:
        room_id = data.get('room_id')
        user_id = data.get('user_id')
        
        logging.info(f"User {user_id} joining room {room_id}, sid: {sid}")
        
        # Get user from database
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            await sio.emit('error', {'message': 'User not found'}, room=sid)
            return
        
        user = User(**user_doc)
        
        # Get room from database
        room = await db.episode_rooms.find_one({"id": room_id}, {"_id": 0})
        if not room:
            await sio.emit('error', {'message': 'Room not found'}, room=sid)
            return
        
        # Check if room expired
        if datetime.fromisoformat(room['expires_at']) < datetime.now(timezone.utc):
            await sio.emit('error', {'message': 'Room has expired'}, room=sid)
            return
        
        # Check user's episode progress for spoiler protection
        progress = await db.user_episode_progress.find_one({
            "user_id": user_id,
            "anime_id": room['anime_id']
        })
        
        episodes_watched = progress.get('episodes_watched', []) if progress else []
        can_join = room['episode_number'] in episodes_watched
        
        # Join the Socket.IO room
        await sio.enter_room(sid, room_id)
        
        # Store user in episode room users
        episode_room_users[sid] = {
            'room_id': room_id,
            'user_id': user_id,
            'user_data': {
                'id': user.id,
                'name': user.name,
                'picture': user.picture,
                'can_see_spoilers': can_join
            }
        }
        
        # Update room cache
        if room_id not in episode_rooms_cache:
            episode_rooms_cache[room_id] = {
                'room_data': room,
                'users': []
            }
        
        episode_rooms_cache[room_id]['users'].append({
            'sid': sid,
            'user_id': user_id,
            'name': user.name,
            'picture': user.picture
        })
        
        # Update active users count in database
        current_count = len(episode_rooms_cache[room_id]['users'])
        await db.episode_rooms.update_one(
            {"id": room_id},
            {"$set": {"active_users_count": current_count}}
        )
        
        # Notify user they joined
        await sio.emit('episode_room_joined', {
            'room': room,
            'can_see_spoilers': can_join,
            'active_users': current_count
        }, room=sid)
        
        # Notify other users in room
        await sio.emit('episode_room_user_joined', {
            'user': {
                'id': user.id,
                'name': user.name,
                'picture': user.picture
            },
            'active_users': current_count
        }, room=room_id, skip_sid=sid)
        
        # Update arc progression for joining episode room
        await update_user_stats(user.id, "episode_rooms_joined", 1)
        
        # Update passport stats for episode room visits
        try:
            await update_passport_stats(user.id, {"episode_rooms_visited": 1})
        except Exception as e:
            logging.error(f"Error updating passport stats for episode room visit: {e}")
        
        logging.info(f"User {user.name} joined room {room_id}. Active users: {current_count}")
        
    except Exception as e:
        logging.error(f"Error in join_episode_room: {e}", exc_info=True)
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def leave_episode_room(sid):
    try:
        if sid not in episode_room_users:
            return
        
        room_info = episode_room_users[sid]
        room_id = room_info['room_id']
        user_id = room_info['user_id']
        
        # Leave the Socket.IO room
        await sio.leave_room(sid, room_id)
        
        # Remove from episode room users
        del episode_room_users[sid]
        
        # Update room cache
        if room_id in episode_rooms_cache:
            episode_rooms_cache[room_id]['users'] = [
                u for u in episode_rooms_cache[room_id]['users']
                if u['sid'] != sid
            ]
            
            current_count = len(episode_rooms_cache[room_id]['users'])
            
            # Update database
            await db.episode_rooms.update_one(
                {"id": room_id},
                {"$set": {"active_users_count": current_count}}
            )
            
            # Notify other users
            await sio.emit('episode_room_user_left', {
                'user_id': user_id,
                'active_users': current_count
            }, room=room_id)
            
            logging.info(f"User {user_id} left room {room_id}. Active users: {current_count}")
        
        await sio.emit('episode_room_left', room=sid)
        
    except Exception as e:
        logging.error(f"Error in leave_episode_room: {e}", exc_info=True)

@sio.event
async def send_episode_room_message(sid, data):
    try:
        if sid not in episode_room_users:
            await sio.emit('error', {'message': 'Not in a room'}, room=sid)
            return
        
        room_info = episode_room_users[sid]
        room_id = room_info['room_id']
        user_data = room_info['user_data']
        message_text = data.get('message', '')
        spoiler_episode_number = data.get('spoiler_episode_number')  # Optional episode number for spoiler tagging
        
        # Get room info to determine current episode
        room = await db.episode_rooms.find_one({"id": room_id}, {"_id": 0})
        current_episode = room['episode_number'] if room else 1
        
        # Enhanced spoiler detection
        spoiler_keywords = ['dies', 'killed', 'death', 'ending', 'finale', 'spoiler', 'revealed', 'twist', 'betrays', 'betrayed']
        keyword_detected = any(keyword in message_text.lower() for keyword in spoiler_keywords)
        
        # Determine if message is a spoiler and which episode it spoils
        is_spoiler = False
        final_spoiler_episode = None
        
        if spoiler_episode_number:
            # User explicitly tagged the message with an episode number
            is_spoiler = spoiler_episode_number > current_episode
            final_spoiler_episode = spoiler_episode_number
        elif keyword_detected:
            # Keyword detected - assume it spoils current episode
            is_spoiler = True
            final_spoiler_episode = current_episode
        
        # Create message
        message = EpisodeRoomMessage(
            room_id=room_id,
            user_id=user_data['id'],
            user_name=user_data['name'],
            user_picture=user_data['picture'],
            message=message_text,
            is_spoiler=is_spoiler,
            spoiler_episode_number=final_spoiler_episode
        )
        
        message_dict = message.dict()
        message_dict['timestamp'] = message_dict['timestamp'].isoformat()
        
        # Save to database
        await db.episode_room_messages.insert_one(message_dict)
        
        # Update room message count
        await db.episode_rooms.update_one(
            {"id": room_id},
            {"$inc": {"total_messages": 1}}
        )
        
        # Send personalized messages to each user based on their episode progress
        if room_id in episode_rooms_cache:
            anime_id = room['anime_id']
            
            for user_info in episode_rooms_cache[room_id]['users']:
                user_sid = user_info['sid']
                target_user_id = user_info['user_id']
                
                # Get user's episode progress
                progress = await db.user_episode_progress.find_one({
                    "user_id": target_user_id,
                    "anime_id": anime_id
                })
                
                episodes_watched = progress.get('episodes_watched', []) if progress else []
                
                # Determine if user can see this message
                can_see_message = True
                if is_spoiler and final_spoiler_episode:
                    can_see_message = final_spoiler_episode in episodes_watched
                
                if can_see_message:
                    # Send full message
                    await sio.emit('episode_room_message', message_dict, room=user_sid)
                else:
                    # Send locked message
                    locked_message = message_dict.copy()
                    locked_message['message'] = f"🔒 Locked until you reach Episode {final_spoiler_episode}"
                    locked_message['is_locked'] = True
                    locked_message['locked_until_episode'] = final_spoiler_episode
                    await sio.emit('episode_room_message', locked_message, room=user_sid)
        
        # Update arc progression for message sender
        await update_user_stats(user_data['id'], "messages_sent", 1)
        
        # Update passport stats for episode room messages
        try:
            await update_passport_stats(user_data['id'], {"messages_sent": 1})
        except Exception as e:
            logging.error(f"Error updating passport stats for episode room message: {e}")
        
        logging.info(f"Message sent in room {room_id} by {user_data['name']}, spoiler: {is_spoiler}, episode: {final_spoiler_episode}")
        
    except Exception as e:
        logging.error(f"Error in send_episode_room_message: {e}", exc_info=True)
        await sio.emit('error', {'message': str(e)}, room=sid)

# Direct Message Socket.IO Events
direct_message_users = {}  # sid -> user_data mapping for direct messages

@sio.event
async def register_for_notifications(sid, data):
    """Register a user for global notifications"""
    try:
        user_data = data.get('user_data')
        user_id = data.get('user_id')
        
        if not user_data or not user_id:
            await sio.emit('error', {'message': 'Missing user data'}, room=sid)
            return
        
        # Register user in active_users for global notifications
        active_users[user_id] = {'sid': sid, 'user_data': user_data}
        
        # Notify all clients that this user came online
        await sio.emit('user_online', user_id)
        
        # Send updated online users list to everyone (including the new user)
        online_user_ids = list(active_users.keys())
        await sio.emit('online_users_update', online_user_ids)
        logging.info(f"Broadcasting online users list: {len(online_user_ids)} users online")
        
        await sio.emit('notification_registration_success', {
            'message': 'Registered for notifications',
            'user_id': user_id
        }, room=sid)
        
        logging.info(f"User {user_data.get('name', user_id)} registered for notifications")
        
    except Exception as e:
        logging.error(f"Error in register_for_notifications: {e}", exc_info=True)
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def join_direct_chat(sid, data):
    try:
        user_data = data.get('user_data')
        friend_id = data.get('friend_id')
        user_id = data.get('user_id')  # Also check for user_id parameter
        
        # Use user_id if user_data is not provided
        if not user_data and user_id:
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user_doc:
                user_data = user_doc
        
        if not user_data or not friend_id:
            await sio.emit('error', {'message': 'Missing user data or friend ID'}, room=sid)
            return
        
        # Prevent users from chatting with themselves
        if user_data['id'] == friend_id:
            await sio.emit('error', {'message': 'Cannot start a chat with yourself'}, room=sid)
            return
        
        # Verify friendship exists
        friendship = await db.friendships.find_one({
            "$or": [
                {"user1_id": user_data['id'], "user2_id": friend_id},
                {"user1_id": friend_id, "user2_id": user_data['id']}
            ]
        })
        
        if not friendship:
            await sio.emit('error', {'message': 'Not friends with this user'}, room=sid)
            return
        
        # Store user data for this session
        direct_message_users[sid] = {
            'user_data': user_data,
            'friend_id': friend_id
        }
        
        # Join a room for this conversation (use sorted IDs for consistency)
        room_name = f"direct_{min(user_data['id'], friend_id)}_{max(user_data['id'], friend_id)}"
        await sio.enter_room(sid, room_name)
        
        await sio.emit('direct_chat_joined', {
            'friend_id': friend_id,
            'room': room_name
        }, room=sid)
        
        logging.info(f"User {user_data['name']} joined direct chat with {friend_id}")
        
    except Exception as e:
        logging.error(f"Error in join_direct_chat: {e}", exc_info=True)
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def send_direct_message(sid, data):
    try:
        if sid not in direct_message_users:
            await sio.emit('error', {'message': 'Not in a direct chat'}, room=sid)
            return
        
        chat_info = direct_message_users[sid]
        user_data = chat_info['user_data']
        friend_id = chat_info['friend_id']
        message_text = data.get('message', '')
        
        if not message_text.strip():
            await sio.emit('error', {'message': 'Message cannot be empty'}, room=sid)
            return
        
        # Create direct message
        direct_message = DirectMessage(
            from_user_id=user_data['id'],
            to_user_id=friend_id,
            message=message_text
        )
        
        message_dict = direct_message.dict()
        message_dict['timestamp'] = message_dict['timestamp'].isoformat()
        message_dict['from_user_name'] = user_data['name']
        message_dict['from_user_picture'] = user_data.get('picture')
        
        # Create a copy for database insertion (will get _id added)
        db_message_dict = message_dict.copy()
        await db.direct_messages.insert_one(db_message_dict)
        
        # Send to both users in the conversation room (use original dict without _id)
        room_name = f"direct_{min(user_data['id'], friend_id)}_{max(user_data['id'], friend_id)}"
        await sio.emit('direct_message_received', message_dict, room=room_name)
        
        # Also send a global notification to the recipient if they're online but not in the chat room
        if friend_id in active_users:
            recipient_sid = active_users[friend_id]['sid']
            # Check if recipient is not already in the direct chat room
            rooms = sio.manager.get_rooms(recipient_sid, '/')
            if room_name not in rooms:
                # Send notification to recipient for unread message count update
                await sio.emit('new_message_notification', {
                    'from_user_id': user_data['id'],
                    'from_user_name': user_data['name'],
                    'from_user_picture': user_data.get('picture'),
                    'message_preview': message_text[:50] + ('...' if len(message_text) > 50 else ''),
                    'timestamp': message_dict['timestamp']
                }, room=recipient_sid)
                logging.info(f"Sent notification to {friend_id} (not in chat room)")
        
        # Update passport stats for direct messages
        try:
            await update_passport_stats(user_data['id'], {"messages_sent": 1})
        except Exception as e:
            logging.error(f"Error updating passport stats for direct message: {e}")
        
        logging.info(f"Direct message sent from {user_data['name']} to {friend_id}")
        
    except Exception as e:
        logging.error(f"Error in send_direct_message: {e}", exc_info=True)
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def leave_direct_chat(sid):
    try:
        if sid in direct_message_users:
            chat_info = direct_message_users[sid]
            user_data = chat_info['user_data']
            friend_id = chat_info['friend_id']
            
            # Leave the room
            room_name = f"direct_{min(user_data['id'], friend_id)}_{max(user_data['id'], friend_id)}"
            await sio.leave_room(sid, room_name)
            
            # Remove from tracking
            del direct_message_users[sid]
            
            await sio.emit('direct_chat_left', room=sid)
            logging.info(f"User {user_data['name']} left direct chat with {friend_id}")
        
    except Exception as e:
        logging.error(f"Error in leave_direct_chat: {e}", exc_info=True)

@sio.event
async def get_online_users(sid):
    """Send list of currently online users to the requesting client"""
    try:
        online_user_ids = list(active_users.keys())
        await sio.emit('online_users_update', online_user_ids, room=sid)
        logging.info(f"Sent online users list to {sid}: {len(online_user_ids)} users online")
    except Exception as e:
        logging.error(f"Error in get_online_users: {e}")

@api_router.delete("/chat/history/{friend_id}")
async def delete_chat_history(friend_id: str, request: Request):
    """Delete all chat history with a specific friend"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Verify friendship exists
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user.id, "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": user.id}
        ]
    })
    
    if not friendship:
        raise HTTPException(status_code=403, detail="Not friends with this user")
    
    # Delete all direct messages between these two users
    result = await db.direct_messages.delete_many({
        "$or": [
            {"from_user_id": user.id, "to_user_id": friend_id},
            {"from_user_id": friend_id, "to_user_id": user.id}
        ]
    })
    
    return {"message": f"Deleted {result.deleted_count} messages", "deleted_count": result.deleted_count}

@api_router.delete("/friends/{friend_id}")
async def unfriend_user(friend_id: str, request: Request):
    """Remove a friend (unfriend)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Check if friendship exists
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user.id, "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": user.id}
        ]
    })
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    # Delete the friendship
    await db.friendships.delete_one({"id": friendship["id"]})
    
    # Optionally delete chat history as well when unfriending
    await db.direct_messages.delete_many({
        "$or": [
            {"from_user_id": user.id, "to_user_id": friend_id},
            {"from_user_id": friend_id, "to_user_id": user.id}
        ]
    })
    
    # Update passport stats for both users (decrease friend count)
    try:
        await update_passport_stats(user.id, {"total_friends": -1})
        await update_passport_stats(friend_id, {"total_friends": -1})
    except Exception as e:
        logging.error(f"Error updating passport stats for unfriend: {e}")
    
    # Get friend's name for response
    friend_user = await db.users.find_one({"id": friend_id}, {"_id": 0, "name": 1})
    friend_name = friend_user.get("name", "Unknown") if friend_user else "Unknown"
    
    return {"message": f"Successfully unfriended {friend_name}"}

# Report & Block Endpoints
@api_router.post("/reports")
async def create_report(report_data: dict, request: Request):
    """Submit a report for a user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    reported_user_id = report_data.get('reported_user_id')
    reason = report_data.get('reason')
    additional_details = report_data.get('additional_details', '')
    
    if not reported_user_id or not reason:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Check if reported user exists
    reported_user = await db.users.find_one({"id": reported_user_id})
    if not reported_user:
        raise HTTPException(status_code=404, detail="Reported user not found")
    
    # Prevent self-reporting
    if reported_user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
    
    # Create report
    report = UserReport(
        reporter_user_id=user.id,
        reported_user_id=reported_user_id,
        reason=reason,
        additional_details=additional_details
    )
    
    report_dict = report.dict()
    report_dict['created_at'] = report_dict['created_at'].isoformat()
    
    await db.user_reports.insert_one(report_dict)
    
    logging.info(f"User {user.id} reported user {reported_user_id} for {reason}")
    
    return {"message": "Report submitted successfully", "report_id": report.id}

@api_router.post("/block-user")
async def block_user(block_data: dict, request: Request):
    """Block a user from matching and messaging"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    blocked_user_id = block_data.get('blocked_user_id')
    
    if not blocked_user_id:
        raise HTTPException(status_code=400, detail="Missing blocked_user_id")
    
    # Check if blocked user exists
    blocked_user = await db.users.find_one({"id": blocked_user_id})
    if not blocked_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-blocking
    if blocked_user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    # Check if already blocked
    existing_block = await db.blocked_users.find_one({
        "blocker_user_id": user.id,
        "blocked_user_id": blocked_user_id
    })
    
    if existing_block:
        return {"message": "User already blocked"}
    
    # Create block
    block = BlockedUser(
        blocker_user_id=user.id,
        blocked_user_id=blocked_user_id
    )
    
    block_dict = block.dict()
    block_dict['created_at'] = block_dict['created_at'].isoformat()
    
    await db.blocked_users.insert_one(block_dict)
    
    # Remove friendship if exists
    await db.friendships.delete_many({
        "$or": [
            {"user1_id": user.id, "user2_id": blocked_user_id},
            {"user1_id": blocked_user_id, "user2_id": user.id}
        ]
    })
    
    # Remove pending friend requests
    await db.friend_requests.delete_many({
        "$or": [
            {"from_user_id": user.id, "to_user_id": blocked_user_id},
            {"from_user_id": blocked_user_id, "to_user_id": user.id}
        ]
    })
    
    logging.info(f"User {user.id} blocked user {blocked_user_id}")
    
    return {"message": "User blocked successfully"}

@api_router.delete("/block-user/{blocked_user_id}")
async def unblock_user(blocked_user_id: str, request: Request):
    """Unblock a user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Remove block
    result = await db.blocked_users.delete_one({
        "blocker_user_id": user.id,
        "blocked_user_id": blocked_user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Block not found")
    
    logging.info(f"User {user.id} unblocked user {blocked_user_id}")
    
    return {"message": "User unblocked successfully"}

@api_router.get("/blocked-users")
async def get_blocked_users(request: Request):
    """Get list of blocked users"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Get all blocks by this user
    blocks = await db.blocked_users.find({
        "blocker_user_id": user.id
    }).to_list(100)
    
    blocked_user_ids = [block['blocked_user_id'] for block in blocks]
    
    # Get user info for blocked users
    blocked_users = []
    for blocked_id in blocked_user_ids:
        blocked_user = await db.users.find_one(
            {"id": blocked_id},
            {"_id": 0, "id": 1, "name": 1, "picture": 1}
        )
        if blocked_user:
            blocked_users.append(blocked_user)
    
    return blocked_users

@api_router.get("/check-blocked/{user_id}")
async def check_if_blocked(user_id: str, request: Request):
    """Check if a user is blocked"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401)
    
    # Check if user is blocked by current user
    blocked_by_me = await db.blocked_users.find_one({
        "blocker_user_id": user.id,
        "blocked_user_id": user_id
    })
    
    # Check if current user is blocked by other user
    blocked_me = await db.blocked_users.find_one({
        "blocker_user_id": user_id,
        "blocked_user_id": user.id
    })
    
    return {
        "is_blocked": blocked_by_me is not None,
        "has_blocked_me": blocked_me is not None
    }
# Include the router in the main app
app.include_router(api_router)

# CORS Configuration for production deployment
allowed_origins = [
    "https://aniverse-kkvz.vercel.app",  # Production Vercel domain
    "http://localhost:3000",  # Local development
    "http://127.0.0.1:3000",  # Local development alternative
    "http://localhost:3001",  # Local development (alt port)
    "http://localhost:3002",  # Local development (alt port)
    "http://localhost:3003",  # Local development (alt port)
    "http://127.0.0.1:3001",  # Local development alternative
    "http://127.0.0.1:3002",  # Local development alternative
    "http://127.0.0.1:3003",  # Local development alternative
]

# Add any additional origins from environment variable
env_origins = os.environ.get('CORS_ORIGINS', '')
if env_origins:
    additional_origins = [origin.strip() for origin in env_origins.split(',') if origin.strip()]
    allowed_origins.extend(additional_origins)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Duplicate shutdown handler removed - using the proper one defined earlier

# Export socket app for uvicorn - this should be the combined app
# Don't overwrite the original app variable
socket_app_export = socket_app