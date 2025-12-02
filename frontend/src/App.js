import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import ProfileSetup from "./pages/ProfileSetup";
import ChatPage from "./pages/ChatPage";
import DirectChat from "./pages/DirectChat";
import ProfilePage from "./pages/ProfilePage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import RefundPolicy from "./pages/RefundPolicy";
import MainLayout from "./components/MainLayout";
import AnimeLoadingScreen from "./components/AnimeLoadingScreen";
import GenderSelectionModal from "./components/GenderSelectionModal";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API = `${BACKEND_URL}/api`;

console.log('Environment variables:', {
  REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  BACKEND_URL,
  API
});

export const axiosInstance = axios.create({
  baseURL: API,
  withCredentials: true,
  timeout: 10000 // 10 second timeout
});

function AuthWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication when component mounts
    const initAuth = async () => {
      await checkAuth();
    };
    
    initAuth();
    
    // Safety timeout - force loading to finish after 15 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout triggered - forcing loading to finish');
      setLoading(false);
    }, 15000);
    
    return () => clearTimeout(safetyTimeout);
  }, []);

  const checkAuth = async () => {
    try {
      console.log('=== CHECKING AUTH ===');
      console.log('Backend URL:', BACKEND_URL);
      console.log('API URL:', API);
      console.log('Current URL:', window.location.href);
      console.log('Current hash:', window.location.hash);
      console.log('Current pathname:', window.location.pathname);
      console.log('All cookies:', document.cookie);
      
      // Check for session_id in URL fragment
      const hash = window.location.hash;
      console.log('Checking hash for session_id:', hash);
      if (hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        console.log('Found session_id in URL:', sessionId);
        
        try {
          // Exchange session_id for session_token
          console.log('Exchanging session_id for session_token...');
          console.log('Making POST request to:', `${API}/auth/session`);
          console.log('Request URL:', `${API}/auth/session?session_id=${sessionId}`);
          console.log('With params:', { session_id: sessionId });
          console.log('Axios config:', axiosInstance.defaults);
          
          const response = await axiosInstance.post('auth/session', null, {
            params: { session_id: sessionId },
            withCredentials: true
          });
          
          console.log('✅ Authentication successful!');
          console.log('Response:', response);
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
          console.log('Response data:', response.data);
          console.log('User data:', response.data.user);
          console.log('Session token received:', response.data.session_token ? 'YES' : 'NO');
          console.log('Cookies after auth:', document.cookie);
          
          if (!response.data.user) {
            console.error('❌ No user data in response!');
            setLoading(false);
            return;
          }
          
          const userData = response.data.user;
          console.log('Setting user state with:', userData);
          setUser(userData);
          
          // Store session info in localStorage as backup
          localStorage.setItem('user_id', userData.id);
          localStorage.setItem('user_email', userData.email);
          localStorage.setItem('session_token', response.data.session_token);
          console.log('✅ User stored in state and localStorage');
          
          // Clean URL
          console.log('Cleaning URL hash...');
          window.history.replaceState({}, document.title, '/');
          
          // Set loading to false after user is set
          console.log('Setting loading to false');
          setLoading(false);
          
          // Check if this is a first-time user (no gender set)
          if (!userData.gender) {
            console.log('First-time user detected, showing gender modal...');
            setShowGenderModal(true);
          } else {
            // Use setTimeout to ensure state updates are processed
            setTimeout(() => {
              console.log('Navigating to chat...');
              navigate('/chat', { replace: true });
            }, 100);
          }
          return;
        } catch (authError) {
          console.error('Authentication failed:', authError);
          console.error('Auth error details:', authError.response?.data);
          console.error('Auth error status:', authError.response?.status);
          console.error('Auth error message:', authError.message);
          console.error('Auth error config:', authError.config);
          setLoading(false);
          return;
        }
      }
      
      // Check existing session
      console.log('No session_id in URL, checking existing session...');
      console.log('Cookies before /auth/me:', document.cookie);
      try {
        const response = await axiosInstance.get('auth/me');
        console.log('Existing session found:', response.data);
        setUser(response.data);
      } catch (sessionError) {
        console.log('No existing session:', sessionError.message);
        console.log('Session error response:', sessionError.response?.data);
        console.log('Session error status:', sessionError.response?.status);
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

  const handleGenderSelect = async (gender) => {
    try {
      console.log('Updating user gender:', gender);
      // Update user profile with selected gender
      const response = await axiosInstance.put('profile', {
        ...user,
        gender: gender
      });
      
      const updatedUser = response.data;
      setUser(updatedUser);
      setShowGenderModal(false);
      
      console.log('Gender updated successfully, navigating to chat...');
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 100);
    } catch (error) {
      console.error('Error updating gender:', error);
      // Still close modal and navigate on error to prevent blocking
      setShowGenderModal(false);
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 100);
    }
  };

  const handleCloseGenderModal = () => {
    setShowGenderModal(false);
    // Navigate to chat even if user closes without selecting
    setTimeout(() => {
      navigate('/chat', { replace: true });
    }, 100);
  };

  if (loading) {
    return <AnimeLoadingScreen />;
  }

  return (
    <>
    <Routes>
      <Route path="/" element={user ? <Navigate to="/chat" /> : <LandingPage />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/guidelines" element={<CommunityGuidelines />} />
      <Route path="/refund" element={<RefundPolicy />} />
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
      <Route
        path="/profile/:friendId"
        element={
          user ? (
            <MainLayout user={user} setUser={setUser}>
              <ProfilePage user={user} />
            </MainLayout>
          ) : (
            <Navigate to="/" />
          )
        }
      />
      </Routes>
      
      {/* Gender Selection Modal for first-time users */}
      <GenderSelectionModal
        isOpen={showGenderModal}
        onClose={handleCloseGenderModal}
        onGenderSelect={handleGenderSelect}
      />
    </>
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
