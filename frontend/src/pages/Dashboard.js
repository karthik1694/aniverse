import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { MessageCircle, Users, Bell, X, PanelLeft, Sparkles, Tv, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import { toast } from 'sonner';
import UserAvatar from '../components/UserAvatar';
import BrandLogo from '../components/BrandLogo';

export default function Dashboard({ user, onStartChat, onOpenMenu, onlineUsersCount = 0, notifications = [], clearNotification, markNotificationRead }) {
  const navigate = useNavigate();
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const friendRequestsRef = useRef(null);
  const notificationsRef = useRef(null);

  // Load friend requests with refresh
  useEffect(() => {
    const loadFriendRequests = async () => {
      try {
        // For anonymous users, pass user_id as query parameter
        const params = user?.isAnonymous ? { user_id: user?.id } : {};
        const response = await axiosInstance.get('friend-requests', { params });
        console.log('📥 Friend requests loaded:', response.data);
        setFriendRequests(response.data || []);
      } catch (error) {
        console.error('❌ Error loading friend requests:', error);
      }
    };
    
    if (user?.id) {
      loadFriendRequests();
      // Refresh every 30 seconds to catch any missed real-time notifications
      const interval = setInterval(loadFriendRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (friendRequestsRef.current && !friendRequestsRef.current.contains(event.target)) {
        setShowFriendRequests(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      // Always include user data in the request as a fallback for authentication
      const requestBody = { user_data: user };
      await axiosInstance.post(`friend-requests/${requestId}/accept`, requestBody);
      setFriendRequests(prev => prev.filter(r => r.request.id !== requestId));
      toast.success('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      // Always include user data in the request as a fallback for authentication
      const requestBody = { user_data: user };
      await axiosInstance.post(`friend-requests/${requestId}/reject`, requestBody);
      setFriendRequests(prev => prev.filter(r => r.request.id !== requestId));
      toast.info('Friend request declined');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to decline request');
    }
  };

  const handleStartChat = () => {
    // Use onStartChat prop if provided, otherwise navigate
    if (onStartChat) {
      onStartChat();
    } else {
      navigate('/chat');
    }
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex flex-col overflow-auto">
      {/* Chat panel toggle (mobile) — sits below the site header, opens Friends/DMs */}
      <button
        onClick={onOpenMenu}
        className="md:hidden absolute top-3 left-3 z-[70] flex items-center gap-1.5 text-gray-300 hover:text-white px-2.5 py-1.5 bg-[#1a2332]/80 border border-white/10 rounded-lg text-xs"
        aria-label="Open friends and messages"
      >
        <PanelLeft className="h-4 w-4" /> Chats
      </button>

      {/* Floating quick actions: friend requests + notifications */}
      <div className="absolute top-3 right-3 sm:right-4 z-[70] flex items-center gap-2">
        <div className="flex items-center gap-2">
          {/* Friend Requests Icon with Dropdown */}
          <div className="relative" ref={friendRequestsRef}>
            <button 
              onClick={() => setShowFriendRequests(!showFriendRequests)}
              className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <Users className="h-5 w-5" />
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>
            
            {/* Friend Requests Dropdown */}
            {showFriendRequests && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#2b3544] rounded-lg shadow-xl border border-gray-700/50 z-[80] overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b border-gray-700/50">
                  <Users className="h-5 w-5 text-white" />
                  <h3 className="text-white font-semibold">Friend Requests</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {friendRequests.length > 0 ? (
                    friendRequests.map(({ request, from_user }) => (
                      <div key={request.id} className="p-3 border-b border-gray-700/30 last:border-b-0">
                        <div className="flex items-center gap-3 mb-2">
                          <UserAvatar user={from_user} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{from_user.name}</p>
                            <p className="text-gray-400 text-xs">sent you a friend request.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptRequest(request.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            size="sm"
                            variant="ghost"
                            className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1 h-7"
                          >
                            Ignore
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      No pending friend requests
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Notifications Icon with Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#2b3544] rounded-lg shadow-xl border border-gray-700/50 z-[80] overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b border-gray-700/50">
                  <Bell className="h-5 w-5 text-white" />
                  <h3 className="text-white font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border-b border-gray-700/30 last:border-b-0 ${!notification.read ? 'bg-cyan-500/10' : ''}`}
                        onClick={() => markNotificationRead && markNotificationRead(notification.id)}
                      >
                        <div className="flex items-center gap-3">
                          {notification.user && <UserAvatar user={notification.user} size="sm" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm">{notification.message}</p>
                            <p className="text-gray-400 text-xs">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification && clearNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-4 sm:py-6">
        <div className="w-full max-w-md mx-auto">
          {/* Hero */}
          <div className="text-center mb-5">
            <div className="flex justify-center mb-3">
              <BrandLogo iconOnly size="xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              otaku<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">cafe</span>
              <span className="text-purple-400 text-base sm:text-lg">.fun</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1.5">Meet anime fans who watch what you watch</p>
            {onlineUsersCount > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-3 bg-green-500/15 border border-green-500/30 text-green-300 px-3 py-1 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold">{onlineUsersCount.toLocaleString()}</span> online now
              </div>
            )}
          </div>

          {/* Main Card */}
          <div className="bg-[#141b29]/90 backdrop-blur-xl rounded-2xl p-5 shadow-2xl shadow-black/40 border border-white/10">
            {/* How matching works */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h2 className="text-white font-semibold text-sm">How we match you</h2>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                    <Tv className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium leading-tight">Both watching now</p>
                    <p className="text-xs text-gray-400 leading-snug">Shared current shows are your strongest matches</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium leading-tight">Completed &amp; genres</p>
                    <p className="text-xs text-gray-400 leading-snug">Anime you've both finished and genres you share</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium leading-tight">Similar activity level</p>
                    <p className="text-xs text-gray-400 leading-snug">Binge-watchers meet binge-watchers</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/watchlist')}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-medium border border-cyan-500/20 rounded-lg py-2 hover:bg-cyan-500/10 transition-colors"
              >
                Build your watchlist for better matches <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-px bg-white/5 my-4" />

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Main Chat Button */}
              <Button
                onClick={handleStartChat}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3.5 text-base font-bold rounded-xl shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Text Chat
              </Button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-gray-400 text-xs sm:text-sm mt-2">
              Be respectful and follow our{' '}
              <a href="/guidelines" className="text-cyan-400 hover:text-cyan-300 underline">
                chat rules
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
