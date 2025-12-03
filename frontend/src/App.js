import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import InterestsSelectionModal from "./components/InterestsSelectionModal";
import { Toaster } from "./components/ui/sonner";
import { axiosInstance, BACKEND_URL, API } from "./api/axiosInstance";
import { 
  createAnonymousSession, 
  getAnonymousSession, 
  isAnonymousUser 
} from "./utils/anonymousAuth";

function AuthWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
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
      
      // Check for session_id in URL fragment (OAuth callback)
      const hash = window.location.hash;
      console.log('Checking hash for session_id:', hash);
      if (hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        console.log('Found session_id in URL:', sessionId);
        
        try {
          // Exchange session_id for session_token
          console.log('Exchanging session_id for session_token...');
          const response = await axiosInstance.post('auth/session', null, {
            params: { session_id: sessionId },
            withCredentials: true
          });
          
          console.log('✅ Authentication successful!');
          
          if (!response.data.user) {
            console.error('❌ No user data in response!');
            setLoading(false);
            return;
          }
          
          const userData = response.data.user;
          console.log('Setting user state with:', userData);
          setUser(userData);
          
          // Store session info in localStorage
          localStorage.setItem('user_id', userData.id);
          localStorage.setItem('user_email', userData.email);
          localStorage.setItem('session_token', response.data.session_token);
          console.log('✅ User stored in state and localStorage');
          
          // Clean URL
          window.history.replaceState({}, document.title, '/');
          setLoading(false);
          
          // Check if this is a first-time user (no gender set)
          if (!userData.gender) {
            console.log('First-time user detected, showing gender modal...');
            setShowGenderModal(true);
          } else {
            setTimeout(() => {
              navigate('/chat', { replace: true });
            }, 100);
          }
          return;
        } catch (authError) {
          console.error('Authentication failed:', authError);
          setLoading(false);
          return;
        }
      }
      
      // Check existing OAuth session
      console.log('No session_id in URL, checking existing OAuth session...');
      try {
        const response = await axiosInstance.get('auth/me');
        console.log('Existing OAuth session found:', response.data);
        setUser(response.data);
        setLoading(false);
        return;
      } catch (sessionError) {
        console.log('No OAuth session found, checking anonymous session...');
      }
      
      // Check for existing anonymous session
      const anonymousSession = getAnonymousSession();
      if (anonymousSession) {
        console.log('✅ Found existing anonymous session:', anonymousSession.user.name);
        setUser(anonymousSession.user);
        setLoading(false);
        
        // Check if anonymous user needs to set gender
        if (!anonymousSession.user.gender) {
          console.log('Anonymous user needs to select gender, showing modal...');
          setShowGenderModal(true);
        }
        return;
      }
      
      // No session found - user will stay on landing page
      console.log('No session found');
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
      
      // For anonymous users, update localStorage
      if (isAnonymousUser(user)) {
        const updatedUser = {
          ...user,
          gender: gender
        };
        
        // Update localStorage for anonymous users
        localStorage.setItem('anonymous_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowGenderModal(false);
        
        // Show interests modal next
        console.log('Anonymous user gender updated, showing interests modal...');
        setShowInterestsModal(true);
      } else {
        // For authenticated users, update via API
        const response = await axiosInstance.put('profile', {
          ...user,
          gender: gender
        });
        
        const updatedUser = response.data;
        setUser(updatedUser);
        setShowGenderModal(false);
        
        // Navigate to chat/dashboard after gender selection
        console.log('Gender updated successfully, navigating to chat...');
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error updating gender:', error);
      // Still close modal and navigate to chat
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

  const handleInterestsComplete = async (interests) => {
    try {
      console.log('Updating user interests:', interests);
      
      // For anonymous users, update localStorage
      if (isAnonymousUser(user)) {
        const updatedUser = {
          ...user,
          favorite_anime: interests.favorite_anime || [],
          favorite_genres: interests.favorite_genres || [],
          favorite_themes: interests.favorite_themes || []
        };
        
        // Update localStorage for anonymous users
        localStorage.setItem('anonymous_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowInterestsModal(false);
        
        console.log('Anonymous user interests updated successfully, navigating to chat...');
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 100);
      } else {
        // For authenticated users, update via API
        const response = await axiosInstance.put('profile', {
          ...user,
          favorite_anime: interests.favorite_anime || [],
          favorite_genres: interests.favorite_genres || [],
          favorite_themes: interests.favorite_themes || []
        });
        
        const updatedUser = response.data;
        setUser(updatedUser);
        setShowInterestsModal(false);
        
        console.log('Interests updated successfully, navigating to chat...');
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error updating interests:', error);
      // Still close modal and navigate on error to prevent blocking
      setShowInterestsModal(false);
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 100);
    }
  };

  const handleCloseInterestsModal = () => {
    setShowInterestsModal(false);
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
      
      {/* Interests Selection Modal for first-time users */}
      <InterestsSelectionModal
        isOpen={showInterestsModal}
        onClose={handleCloseInterestsModal}
        onComplete={handleInterestsComplete}
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
