# Deployment Guide

This project is configured for deployment with:
- **Frontend**: Vercel
- **Backend**: Render

## Project Structure

```
project-main/
├── frontend/          # React frontend for Vercel
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vercel.json    # Vercel configuration
│   └── README.md      # Frontend deployment guide
├── backend/           # Python FastAPI backend for Render
│   ├── main.py        # Entry point
│   ├── server.py      # FastAPI application
│   ├── requirements.txt
│   ├── .env.example   # Environment variables template
│   └── README.md      # Backend deployment guide
└── DEPLOYMENT_GUIDE.md # This file
```

## Quick Deployment Steps

### Backend (Render)

1. Push your code to GitHub
2. Connect GitHub repo to Render
3. Create a new Web Service
4. Set root directory to `backend`
5. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`
6. Add environment variables (see backend/README.md)
7. Deploy

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variables pointing to your Render backend
4. Deploy (automatic)

## Environment Variables

### Backend (Render)
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `CORS_ORIGINS`: Frontend URL (Vercel domain)
- `PORT`: 8000 (auto-set by Render)

### Frontend (Vercel)
- `REACT_APP_API_URL`: Backend URL (Render domain)
- `REACT_APP_SOCKET_URL`: Backend URL for WebSocket connections

## Post-Deployment

1. Update CORS settings in backend to include your Vercel domain
2. Test the connection between frontend and backend
3. Verify WebSocket connections work properly

For detailed instructions, see the README files in each directory.