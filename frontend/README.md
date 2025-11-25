# Frontend Deployment on Vercel

This React frontend is configured to deploy on Vercel.

## Environment Variables

Set the following environment variables in your Vercel project:

```
REACT_APP_API_URL=https://your-backend-service.onrender.com
REACT_APP_SOCKET_URL=https://your-backend-service.onrender.com
```

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Import the project and set the root directory to `frontend`
3. Vercel will automatically detect it's a React app
4. Set the environment variables listed above
5. Deploy

The build settings should be:
- **Framework Preset**: Create React App
- **Root Directory**: frontend
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `build` (auto-detected)

## Local Development

1. Install dependencies: `npm install`
2. Create a `.env.local` file with your environment variables
3. Start the development server: `npm start`

The app will start on `http://localhost:3000`

## Vercel Configuration

The project includes a `vercel.json` file that handles client-side routing for React Router.

## Build Configuration

The project uses:
- **CRACO** for custom webpack configuration
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.IO** for real-time features

Make sure your backend CORS settings include your Vercel domain.
