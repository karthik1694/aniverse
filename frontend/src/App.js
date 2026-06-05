import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import ProfileSetup from "./pages/ProfileSetup";
import ChatPage from "./pages/ChatPage";
import DirectChat from "./pages/DirectChat";
import ProfilePage from "./pages/ProfilePage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import RefundPolicy from "./pages/RefundPolicy";
import ContactUs from "./pages/ContactUs";
import DiscoverPage from "./pages/DiscoverPage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import EpisodeDiscussionPage from "./pages/EpisodeDiscussionPage";
import SchedulePage from "./pages/SchedulePage";
import WatchlistPage from "./pages/WatchlistPage";
import CommunityPage from "./pages/CommunityPage";
import CommunityPostPage from "./pages/CommunityPostPage";
import SiteLayout from "./components/SiteLayout";
import MainLayout from "./components/MainLayout";
import AnimeLoadingScreen from "./components/AnimeLoadingScreen";
import { Toaster } from "./components/ui/sonner";
import { axiosInstance, BACKEND_URL, API } from "./api/axiosInstance";
import { createAnonymousSession, getAnonymousSession, clearAnonymousSession } from "./utils/anonymousAuth";

function AuthWrapper() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
      console.log('Backend URL:', BACKEND_URL, 'API URL:', API);

      // Check for session_id in URL fragment (OAuth callback)
      const hash = window.location.hash;
      if (hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        console.log('Found session_id in URL:', sessionId);

        try {
          const response = await axiosInstance.post('auth/session', null, {
            params: { session_id: sessionId },
            withCredentials: true
          });

          if (!response.data.user) {
            console.error('❌ No user data in response!');
            setLoading(false);
            return;
          }

          const userData = response.data.user;
          setUser(userData);

          localStorage.setItem('user_id', userData.id);
          localStorage.setItem('user_email', userData.email);
          localStorage.setItem('session_token', response.data.session_token);

          // If the user just claimed an anonymous account, migrate its data
          // (interests, friends, pending requests, chat history) into the new
          // account before clearing the anonymous session.
          const pendingAnonId = localStorage.getItem('pending_claim_anon_id');
          if (pendingAnonId) {
            let anonData = null;
            try {
              anonData = JSON.parse(localStorage.getItem('pending_claim_anon_data'));
            } catch (e) {
              // ignore malformed cache
            }
            try {
              const migrateRes = await axiosInstance.post('auth/migrate-anonymous', {
                anonymous_user_id: pendingAnonId,
                anonymous_user_data: anonData
              });
              console.log('✅ Anonymous data migrated to claimed account:', migrateRes.data);

              // Refresh the user so merged interests/bio show up immediately.
              try {
                const refreshed = await axiosInstance.get('auth/me');
                setUser(refreshed.data);
              } catch (refreshError) {
                console.warn('Could not refresh user after migration:', refreshError);
              }
            } catch (migrateError) {
              // Non-fatal: the account is still claimed, just without migrated data.
              console.error('Anonymous migration failed (continuing):', migrateError);
            } finally {
              localStorage.removeItem('pending_claim_anon_id');
              localStorage.removeItem('pending_claim_anon_data');
              clearAnonymousSession();
            }
          }

          // Clean URL and land on the home/discover page.
          // Gender + interests are collected later, inside the Chat flow.
          window.history.replaceState({}, document.title, '/');
          setLoading(false);
          setTimeout(() => navigate('/discover', { replace: true }), 100);
          return;
        } catch (authError) {
          console.error('Authentication failed:', authError);
          setLoading(false);
          return;
        }
      }

      // Check existing OAuth session
      try {
        const response = await axiosInstance.get('auth/me');
        console.log('Existing OAuth session found');
        setUser(response.data);
        setLoading(false);
        return;
      } catch (sessionError) {
        console.log('No OAuth session, checking anonymous session...');
      }

      // Check for existing anonymous session
      const anonymousSession = getAnonymousSession();
      if (anonymousSession) {
        console.log('✅ Found existing anonymous session:', anonymousSession.user.name);
        setUser(anonymousSession.user);
        setLoading(false);
        return;
      }

      // No session found - auto-create an anonymous identity so visitors can
      // browse, discuss, and track immediately with zero friction.
      console.log('No session found - creating anonymous identity');
      const { user: anonUser } = createAnonymousSession();
      setUser(anonUser);
    } catch (error) {
      console.error('General auth error:', error);
      // Last-resort: still give the visitor an anonymous identity
      try {
        const { user: anonUser } = createAnonymousSession();
        setUser(anonUser);
      } catch (e) {
        console.error('Failed to create anonymous identity:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  // Gate ONLY the auth-protected routes behind the auth check.
  // Public, SEO-first pages render immediately so crawlers and first-time
  // visitors never wait.
  const protectedElement = (element) => {
    if (loading) return <AnimeLoadingScreen />;
    return user ? element : <Navigate to="/" />;
  };

  return (
    <Routes>
      {/* Public, SEO-first content pages */}
      <Route path="/" element={<SiteLayout user={user} setUser={setUser}><DiscoverPage user={user} /></SiteLayout>} />
      <Route path="/discover" element={<SiteLayout user={user} setUser={setUser}><DiscoverPage user={user} /></SiteLayout>} />
      <Route path="/schedule" element={<SiteLayout user={user} setUser={setUser}><SchedulePage /></SiteLayout>} />
      <Route path="/watchlist" element={<SiteLayout user={user} setUser={setUser}><WatchlistPage /></SiteLayout>} />
      <Route path="/community" element={<SiteLayout user={user} setUser={setUser}><CommunityPage user={user} setUser={setUser} /></SiteLayout>} />
      <Route path="/community/:postId" element={<SiteLayout user={user} setUser={setUser}><CommunityPostPage user={user} setUser={setUser} /></SiteLayout>} />
      <Route path="/anime/:malId/:slug/episode/:epNum" element={<SiteLayout user={user} setUser={setUser}><EpisodeDiscussionPage user={user} setUser={setUser} /></SiteLayout>} />
      <Route path="/anime/:malId/:slug" element={<SiteLayout user={user} setUser={setUser}><AnimeDetailPage user={user} setUser={setUser} /></SiteLayout>} />
      <Route path="/anime/:malId" element={<SiteLayout user={user} setUser={setUser}><AnimeDetailPage user={user} setUser={setUser} /></SiteLayout>} />

      {/* Legal / info */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/guidelines" element={<CommunityGuidelines />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/contact" element={<ContactUs />} />

      {/* Auth-protected app pages */}
      <Route
        path="/profile-setup"
        element={protectedElement(<ProfileSetup user={user} setUser={setUser} />)}
      />
      <Route
        path="/chat"
        element={protectedElement(
          <MainLayout user={user} setUser={setUser}>
            <ChatPage user={user} setUser={setUser} />
          </MainLayout>
        )}
      />
      <Route
        path="/direct-chat/:friendId"
        element={protectedElement(
          <MainLayout user={user} setUser={setUser}>
            <DirectChat user={user} />
          </MainLayout>
        )}
      />
      <Route
        path="/profile/:friendId"
        element={protectedElement(
          <MainLayout user={user} setUser={setUser}>
            <ProfilePage user={user} />
          </MainLayout>
        )}
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
      <Analytics />
    </div>
  );
}

export default App;
