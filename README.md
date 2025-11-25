# AniConnect - Anime Social Matching Platform

A social platform for anime fans to connect, chat, and share their passion for anime.

## Features

- **Smart Matching System**: Matches users based on shared anime interests, with random fallback matching
- **Real-time Chat**: WebSocket-based chat system for instant messaging
- **Episode Rooms**: Join discussions about specific anime episodes
- **Anime Passport**: Track your anime journey with badges and levels
- **User Profiles**: Customize your profile with favorite anime, genres, and characters

## Deployment

This project is configured for cloud deployment:

- **Frontend**: Deployed on [Vercel](https://vercel.com)
- **Backend**: Deployed on [Render](https://render.com)

For deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## Local Development

### Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (connection string required)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `backend/.env`:
```
MONGO_URL=your_mongodb_connection_string
DB_NAME=chatapp
CORS_ORIGINS=http://localhost:3000
```

4. Start the backend server:
```bash
python main.py
```

Or use the convenience script:
```bash
python start_backend.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Set up environment variables in `frontend/.env.local`:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
```

4. Start the frontend development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Matching System

The platform uses an intelligent matching system that:

1. **Interest-Based Matching**: First tries to match users based on shared anime preferences
2. **Random Fallback**: If no good interest matches are found, randomly matches available users
3. **Real-time Processing**: Matches happen instantly when users join the queue
4. **Compatibility Scoring**: Uses a scoring system based on shared anime, genres, themes, and characters

## API Endpoints

- `GET /api/` - API health check
- `POST /api/auth/session` - Create user session
- `GET /api/auth/me` - Get current user
- `GET /api/anime` - Search anime database
- `PUT /api/profile` - Update user profile
- `GET /api/friends` - Get user's friends
- `POST /api/friend-requests/{user_id}` - Send friend request
- `GET /api/passport` - Get user's anime passport

## WebSocket Events

- `join_matching` - Join the matching queue
- `match_found` - Receive match notification
- `send_message` - Send chat message
- `receive_message` - Receive chat message
- `skip_partner` - Skip current match
- `cancel_matching` - Cancel matching process

## Development

### Backend Development

The backend uses FastAPI with Socket.IO for real-time features. Key files:

- `backend/server.py` - Main server application
- `backend/passport_models.py` - Passport system models
- `backend/main.py` - Server startup script

### Frontend Development

The frontend is built with React and uses Socket.IO client for real-time features. Key files:

- `frontend/src/App.js` - Main application component
- `frontend/src/components/MatchingScreen.js` - Matching interface
- `frontend/src/pages/ChatPage.js` - Chat interface

## Troubleshooting

### Backend Issues

- **Loading screen stuck**: Make sure the backend server is running on port 8000
- **Database connection**: Verify MongoDB connection string in `backend/.env`
- **CORS errors**: Backend is configured to allow all origins for development

### Frontend Issues

- **Can't connect to backend**: Check that `REACT_APP_BACKEND_URL` points to the correct backend URL
- **Socket connection failed**: Ensure backend server is running and accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
