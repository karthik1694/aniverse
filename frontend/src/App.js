import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import ProfileSetup from "./pages/ProfileSetup";
import ChatPage from "./pages/ChatPage";
import DirectChat from "./pages/DirectChat";
import MainLayout from "./components/MainLayout";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: API,
  withCredentials: true
});

function AuthWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('=== CHECKING AUTH ===');
      console.log('Backend URL:', BACKEND_URL);
      console.log('Current URL:', window.location.href);
      console.log('Current hash:', window.location.hash);
      console.log('Current pathname:', window.location.pathname);
      
      // Check for session_id in URL fragment
      const hash = window.location.hash;
      if (hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        console.log('Found session_id in URL:', sessionId);
        
        try {
          // Exchange session_id for session_token
          console.log('Exchanging session_id for session_token...');
          const response = await axiosInstance.post('/auth/session', null, {
            params: { session_id: sessionId }
          });
          
          console.log('Authentication successful!');
          console.log('User data:', response.data.user);
          setUser(response.data.user);
          
          // Clean URL and navigate
          console.log('Cleaning URL and redirecting to chat...');
          window.history.replaceState({}, document.title, '/chat');
          
          // Set loading to false after user is set
          setLoading(false);
          
          // Use setTimeout to ensure state updates are processed
          setTimeout(() => {
            console.log('Navigating to chat...');
            navigate('/chat', { replace: true });
          }, 100);
          return;
        } catch (authError) {
          console.error('Authentication failed:', authError);
          console.error('Auth error details:', authError.response?.data);
          setLoading(false);
          return;
        }
      }
      
      // Check existing session
      console.log('No session_id in URL, checking existing session...');
      try {
        const response = await axiosInstance.get('/auth/me');
        console.log('Existing session found:', response.data);
        setUser(response.data);
      } catch (sessionError) {
        console.log('No existing session:', sessionError.message);
      }
    } catch (error) {
      console.error('General auth error:', error);
      if (error.code === 'ECONNREFUSED') {
        console.error('Backend server is not running on', BACKEND_URL);
      }
    } finally {
      console.log('Auth check complete, setting loading to false');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/chat" /> : <LandingPage />} />
      <Route
        path="/profile-setup"
        element={user ? <ProfileSetup user={user} setUser={setUser} /> : <Navigate to="/" />}
      />
      <Route
        path="/chat"
        element={
          user ? (
            <MainLayout user={user} setUser={setUser}>
              <ChatPage user={user} />
            </MainLayout>
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/direct-chat/:friendId"
        element={
          user ? (
            <MainLayout user={user} setUser={setUser}>
              <DirectChat user={user} />
            </MainLayout>
          ) : (
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthWrapper />
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
