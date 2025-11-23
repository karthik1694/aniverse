from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import hashlib
import random

# Anime Passport Core Models
class AnimePassport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Core Passport Data
    top_5_anime: List[Dict[str, Any]] = []  # [{"title": str, "image_url": str, "rank": int}]
    top_3_characters: List[Dict[str, Any]] = []  # [{"name": str, "anime": str, "image_url": str, "rank": int}]
    anime_vibe: str = "Wholesome"  # "Sad/Emotional", "Dark/Psychological", "Wholesome", "High Energy", "Chaotic Gremlin", "Quiet Protagonist"
    
    # Fate Number (Unique Anime Signature)
    fate_number: int = 0  # Generated based on interests, matching pattern, social style
    fate_number_breakdown: Dict[str, int] = Field(default_factory=dict)  # Shows how fate number was calculated
    
    # Passport Level System
    passport_level: int = 1
    passport_level_name: str = "Rookie Fan"
    total_experience: int = 0
    experience_to_next_level: int = 100
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PassportBadge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    badge_key: str  # Unique identifier like "matchmaker", "theory_crafter"
    name: str
    description: str
    emoji: str
    category: str  # "social", "activity", "achievement", "special"
    rarity: str = "common"  # "common", "rare", "epic", "legendary"
    unlock_condition: Dict[str, Any]  # Condition to unlock this badge
    experience_reward: int = 50  # XP gained when earning this badge
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserPassportBadge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    progress_when_earned: Dict[str, Any] = Field(default_factory=dict)  # User stats when badge was earned

class PassportJourney(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Journey Timeline Events
    journey_events: List[Dict[str, Any]] = []  # Timeline of significant moments
    
    # Key Milestones
    joined_date: datetime
    first_match_date: Optional[datetime] = None
    first_episode_room_date: Optional[datetime] = None
    first_friend_date: Optional[datetime] = None
    first_streak_date: Optional[datetime] = None
    most_emotional_moment: Optional[Dict[str, Any]] = None
    first_hot_take: Optional[Dict[str, Any]] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EpisodeRoomVisit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    room_id: str
    anime_title: str
    episode_number: int
    visit_type: str  # "visited", "debated", "live_chat", "created"
    duration_minutes: int = 0
    messages_sent: int = 0
    visited_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PassportStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Social Stats
    total_matches: int = 0
    successful_matches: int = 0  # Matches that led to friendship
    total_friends: int = 0
    messages_sent: int = 0
    friend_requests_sent: int = 0
    friend_requests_received: int = 0
    
    # Activity Stats
    episode_rooms_visited: int = 0
    episode_rooms_created: int = 0
    total_watch_time_minutes: int = 0
    theories_posted: int = 0
    debates_participated: int = 0
    
    # Engagement Stats
    days_active: int = 0
    longest_streak: int = 0
    current_streak: int = 0
    late_night_sessions: int = 0  # Active 2-4 AM
    weekend_warrior_sessions: int = 0
    
    # Personality Stats
    positive_messages_ratio: float = 0.0  # Ratio of positive to total messages
    theory_accuracy_score: float = 0.0
    debate_win_ratio: float = 0.0
    
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Passport Level Configuration
PASSPORT_LEVELS = {
    1: {"name": "Rookie Fan", "experience_required": 0, "max_experience": 100},
    5: {"name": "Otaku Initiate", "experience_required": 500, "max_experience": 200},
    10: {"name": "Anime Specialist", "experience_required": 1500, "max_experience": 300},
    20: {"name": "Peak Enjoyer", "experience_required": 4500, "max_experience": 500},
    50: {"name": "Legendary Weeb", "experience_required": 15000, "max_experience": 1000},
}

# Badge Definitions
DEFAULT_BADGES = [
    {
        "badge_key": "matchmaker",
        "name": "Matchmaker",
        "description": "Successfully matched with 5 people",
        "emoji": "💕",
        "category": "social",
        "rarity": "common",
        "unlock_condition": {"successful_matches": 5},
        "experience_reward": 100
    },
    {
        "badge_key": "theory_crafter",
        "name": "Theory Crafter",
        "description": "Posted theories in episode rooms",
        "emoji": "🧠",
        "category": "activity",
        "rarity": "common",
        "unlock_condition": {"theories_posted": 3},
        "experience_reward": 75
    },
    {
        "badge_key": "episode_surfer",
        "name": "Episode Surfer",
        "description": "Joined 10 different episode rooms",
        "emoji": "🏄",
        "category": "activity",
        "rarity": "common",
        "unlock_condition": {"episode_rooms_visited": 10},
        "experience_reward": 150
    },
    {
        "badge_key": "night_owl",
        "name": "Night Owl",
        "description": "Active during late night hours (2-4 AM)",
        "emoji": "🦉",
        "category": "special",
        "rarity": "rare",
        "unlock_condition": {"late_night_sessions": 5},
        "experience_reward": 200
    },
    {
        "badge_key": "wholesome_heart",
        "name": "Wholesome Heart",
        "description": "Maintained positive message ratio above 80%",
        "emoji": "💖",
        "category": "social",
        "rarity": "rare",
        "unlock_condition": {"positive_messages_ratio": 0.8, "messages_sent": 50},
        "experience_reward": 250
    },
    {
        "badge_key": "villain_arc",
        "name": "Villain Arc",
        "description": "Returned after being offline for 7+ days",
        "emoji": "😈",
        "category": "special",
        "rarity": "epic",
        "unlock_condition": {"days_offline_return": 7},
        "experience_reward": 300
    },
    {
        "badge_key": "debate_master",
        "name": "Debate Master",
        "description": "Won 10 anime debates",
        "emoji": "⚔️",
        "category": "activity",
        "rarity": "epic",
        "unlock_condition": {"debate_wins": 10},
        "experience_reward": 400
    },
    {
        "badge_key": "legendary_connector",
        "name": "Legendary Connector",
        "description": "Helped 20 people find their anime soulmate",
        "emoji": "🌟",
        "category": "social",
        "rarity": "legendary",
        "unlock_condition": {"successful_matches": 20, "total_friends": 15},
        "experience_reward": 1000
    }
]

# Anime Vibe Definitions
ANIME_VIBES = {
    "Sad / Emotional": {
        "description": "Drawn to tearjerkers and emotional storytelling",
        "color": "from-blue-500 to-indigo-600",
        "emoji": "😢",
        "keywords": ["emotional", "drama", "slice of life", "tragedy"]
    },
    "Dark / Psychological": {
        "description": "Fascinated by complex minds and dark themes",
        "color": "from-purple-600 to-gray-800",
        "emoji": "🧠",
        "keywords": ["psychological", "thriller", "horror", "mystery"]
    },
    "Wholesome": {
        "description": "Loves heartwarming and feel-good stories",
        "color": "from-pink-400 to-rose-500",
        "emoji": "🌸",
        "keywords": ["wholesome", "comedy", "romance", "family"]
    },
    "High Energy": {
        "description": "Thrives on action-packed adventures",
        "color": "from-orange-500 to-red-600",
        "emoji": "⚡",
        "keywords": ["action", "adventure", "shounen", "sports"]
    },
    "Chaotic Gremlin": {
        "description": "Embraces the weird and unpredictable",
        "color": "from-green-500 to-lime-600",
        "emoji": "😈",
        "keywords": ["comedy", "parody", "absurd", "chaotic"]
    },
    "Quiet Protagonist": {
        "description": "Appreciates subtle storytelling and introspection",
        "color": "from-teal-500 to-cyan-600",
        "emoji": "🤫",
        "keywords": ["introspective", "quiet", "philosophical", "contemplative"]
    }
}

# Fate Number Calculation Functions
def calculate_fate_number(user_data: dict, stats: PassportStats) -> tuple[int, dict]:
    """Calculate a user's unique Fate Number based on their anime profile and behavior"""
    
    # Base components for fate number calculation
    components = {}
    
    # Anime preferences influence (0-999)
    anime_hash = hashlib.md5(str(sorted(user_data.get('favorite_anime', []))).encode()).hexdigest()
    anime_component = int(anime_hash[:3], 16) % 1000
    components['anime_taste'] = anime_component
    
    # Social behavior influence (0-999)
    social_score = min(999, (stats.total_friends * 50) + (stats.successful_matches * 30) + (stats.messages_sent // 10))
    components['social_energy'] = social_score
    
    # Activity pattern influence (0-999)
    activity_score = min(999, (stats.episode_rooms_visited * 20) + (stats.theories_posted * 40) + (stats.days_active * 10))
    components['activity_level'] = activity_score
    
    # Personality modifier (0-99)
    personality_mod = int((stats.positive_messages_ratio * 50) + (stats.late_night_sessions * 5)) % 100
    components['personality_quirk'] = personality_mod
    
    # Combine all components with weighted influence
    fate_number = (
        (anime_component * 0.4) +
        (social_score * 0.3) +
        (activity_score * 0.2) +
        (personality_mod * 0.1)
    )
    
    # Ensure it's within 1-9999 range
    final_fate_number = max(1, min(9999, int(fate_number)))
    
    return final_fate_number, components

def get_passport_level_info(total_experience: int) -> dict:
    """Get current level information based on total experience"""
    current_level = 1
    current_level_name = "Rookie Fan"
    experience_to_next = 100
    
    for level, info in sorted(PASSPORT_LEVELS.items()):
        if total_experience >= info['experience_required']:
            current_level = level
            current_level_name = info['name']
            
            # Find next level
            next_levels = [l for l in PASSPORT_LEVELS.keys() if l > level]
            if next_levels:
                next_level = min(next_levels)
                experience_to_next = PASSPORT_LEVELS[next_level]['experience_required'] - total_experience
            else:
                experience_to_next = 0  # Max level reached
        else:
            break
    
    return {
        "level": current_level,
        "name": current_level_name,
        "experience_to_next": max(0, experience_to_next)
    }