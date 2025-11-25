# Backend Deployment on Render

This backend is configured to deploy on Render.com.

## Environment Variables

Set the following environment variables in your Render service:

```
MONGO_URL=your_mongodb_connection_string
DB_NAME=your_database_name
CORS_ORIGINS=https://your-frontend-domain.vercel.app
PORT=8000
HOST=0.0.0.0
NODE_ENV=production
```

## Deployment Steps

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following configuration:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Environment**: Python 3
4. Add the environment variables listed above
5. Deploy

## Local Development

1. Copy `.env.example` to `.env`
2. Update the environment variables with your local values
3. Install dependencies: `pip install -r requirements.txt`
4. Run the server: `python main.py`

The server will start on `http://localhost:8000`