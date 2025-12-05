import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Users, Wifi, WifiOff, Heart, Sparkles, Star, Menu, Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '../api/axiosInstance';
import UserAvatar from './UserAvatar';

const MatchingScreen = ({ 
  matching, 
  socketConnected, 
  onStartMatching, 
  onCancel, 
  onBack,
  onOpenMenu,
  user,
  notifications = [],
  clearNotification,
  markNotificationRead,
  matchingStats = { totalUsers: 0, activeMatchers: 0 }
}) => {
  const [searchPhase, setSearchPhase] = useState(0);
  const [animationStep, setAnimationStep] = useState(0);
  const [searchText, setSearchText] = useState('Initializing...');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const friendRequestsRef = useRef(null);
  const notificationsRef = useRef(null);

  // Load friend requests
  useEffect(() => {
    const loadFriendRequests = async () => {
      try {
        const response = await axiosInstance.get('/friend-requests/pending');
        if (response.data.friend_requests) {
          setFriendRequests(response.data.friend_requests);
        }
      } catch (error) {
        console.error('Error loading friend requests:', error);
      }
    };
    loadFriendRequests();
  }, []);

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
      await axiosInstance.post(`/friend-requests/${requestId}/accept`, requestBody);
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
      await axiosInstance.post(`/friend-requests/${requestId}/reject`, requestBody);
      setFriendRequests(prev => prev.filter(r => r.request.id !== requestId));
      toast.info('Friend request declined');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to decline request');
    }
  };

  // Search phases and messages
  const searchPhases = [
    { text: 'Scanning anime databases...', icon: '🔍', duration: 2000 },
    { text: 'Analyzing your preferences...', icon: '🧠', duration: 1800 },
    { text: 'Finding compatible fans...', icon: '💫', duration: 2200 },
    { text: 'Matching personalities...', icon: '🎭', duration: 1600 },
    { text: 'Connecting hearts...', icon: '💝', duration: 2000 },
    { text: 'Almost there...', icon: '⚡', duration: 1400 }
  ];

  // Animation cycle for the loading rings
  useEffect(() => {
    if (!matching) return;
    
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 8);
    }, 200);
    
    return () => clearInterval(interval);
  }, [matching]);

  // Search phase progression
  useEffect(() => {
    if (!matching) {
      setSearchPhase(0);
      setSearchText('Ready to find your anime soulmate?');
      return;
    }

    const progressPhases = () => {
      const currentPhase = searchPhases[searchPhase];
      setSearchText(currentPhase.text);
      
      const timeout = setTimeout(() => {
        setSearchPhase(prev => (prev + 1) % searchPhases.length);
      }, currentPhase.duration);
      
      return timeout;
    };

    const timeout = progressPhases();
    return () => clearTimeout(timeout);
  }, [matching, searchPhase]);

  // Removed fake skip messages - only show real events

  // Connection retry logic
  useEffect(() => {
    if (!socketConnected && matching) {
      setConnectionAttempts(prev => prev + 1);
      if (connectionAttempts > 0) {
        toast.warning('Reconnecting to server...');
      }
    } else {
      setConnectionAttempts(0);
    }
  }, [socketConnected, matching]);

  const renderLoadingAnimation = () => {
    return (
      <div className="relative w-32 h-32 mx-auto mb-6">
        {/* Outer ring */}
        <div className={`absolute inset-0 rounded-full border-4 border-transparent ${
          animationStep % 4 === 0 ? 'border-t-cyan-400' : 
          animationStep % 4 === 1 ? 'border-r-cyan-400' : 
          animationStep % 4 === 2 ? 'border-b-cyan-400' : 'border-l-cyan-400'
        } animate-spin`} style={{ animationDuration: '2s' }}></div>
        
        {/* Middle ring */}
        <div className={`absolute inset-2 rounded-full border-4 border-transparent ${
          animationStep % 3 === 0 ? 'border-t-blue-400' : 
          animationStep % 3 === 1 ? 'border-r-blue-400' : 'border-b-blue-400'
        } animate-spin`} style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        
        {/* Inner ring */}
        <div className={`absolute inset-4 rounded-full border-4 border-transparent ${
          animationStep % 2 === 0 ? 'border-t-purple-400' : 'border-b-purple-400'
        } animate-spin`} style={{ animationDuration: '1s' }}></div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-pulse">
            {matching ? searchPhases[searchPhase]?.icon || '💫' : '🎌'}
          </div>
        </div>
        
        {/* Floating particles */}
        {matching && (
          <>
            <div className={`absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping ${
              animationStep % 4 === 0 ? 'top-0 left-1/2' :
              animationStep % 4 === 1 ? 'top-1/2 right-0' :
              animationStep % 4 === 2 ? 'bottom-0 left-1/2' : 'top-1/2 left-0'
            }`}></div>
            <div className={`absolute w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping delay-300 ${
              animationStep % 3 === 0 ? 'top-4 right-4' :
              animationStep % 3 === 1 ? 'bottom-4 right-4' : 'bottom-4 left-4'
            }`}></div>
          </>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (!matching) return null;
    
    // Show real queue count - activeMatchers is the actual number searching right now
    const searchingNow = matchingStats.activeMatchers || 0;
    
    return (
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Badge className="bg-cyan-500/20 text-cyan-300 px-2 sm:px-3 py-1 text-xs sm:text-sm animate-pulse">
          <Users className="h-3 w-3 mr-1" />
          <span className="font-semibold">{searchingNow}</span>
          <span className="ml-1">searching right now</span>
        </Badge>
      </div>
    );
  };

  // Removed fake skip message rendering

  const renderConnectionStatus = () => {
    return (
      <div className={`flex items-center justify-center gap-2 mb-4 sm:mb-6 text-xs sm:text-sm ${
        socketConnected ? 'text-green-400' : 'text-yellow-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          socketConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
        }`}></div>
        {socketConnected ? (
          <>
            <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Connected to server</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>
              {connectionAttempts > 0 ? `Reconnecting... (${connectionAttempts})` : 'Connecting...'}
            </span>
          </>
        )}
      </div>
    );
  };

  const renderMatchingTips = () => {
    if (!matching) return null;
    
    const tips = [
      "💡 Tip: Be yourself and share your favorite anime!",
      "🌟 Fun fact: 73% of users find their anime buddy within 3 matches",
      "🎯 Pro tip: Mention your current watching list to break the ice",
      "✨ Did you know? We match based on 50+ anime preferences",
      "🚀 Hang tight! Great matches are worth the wait"
    ];
    
    const currentTip = tips[searchPhase % tips.length];
    
    return (
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-xs sm:text-sm text-gray-300 text-center italic">
          {currentTip}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 md:relative md:h-full flex flex-col bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] overflow-hidden z-[60] md:z-auto">
      {/* Header - Mobile and Desktop */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Menu button - Mobile only */}
          <button
            onClick={onOpenMenu}
            className="md:hidden text-gray-400 hover:text-white p-1"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-white font-semibold text-lg">Finding Match</span>
        </div>
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

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-particle-float"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400/40 rounded-full animate-particle-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-particle-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-pink-400/20 rounded-full animate-particle-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-60 left-1/2 w-1 h-1 bg-blue-300/40 rounded-full animate-particle-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-10 w-1.5 h-1.5 bg-purple-300/30 rounded-full animate-particle-float" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-80 left-1/3 w-1 h-1 bg-cyan-300/35 rounded-full animate-particle-float" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-blue-400/25 rounded-full animate-particle-float" style={{animationDelay: '1.8s'}}></div>
        
        {/* Animated Flowing Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1"/>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.1"/>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          {/* Flowing Curve 1 - Main curve */}
          <path
            d="M-100,400 Q200,200 400,350 T800,300 Q1000,250 1300,400"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            strokeDasharray="10 5"
          />
          
          {/* Flowing Curve 2 - Bottom curve */}
          <path
            d="M-50,600 Q300,450 500,550 T900,500 Q1100,450 1350,600"
            stroke="url(#lineGradient2)"
            strokeWidth="1.5"
            fill="none"
            className="animate-pulse"
            style={{animationDelay: '1.5s'}}
            strokeDasharray="8 4"
          />
          
          {/* Flowing Curve 3 - Top curve */}
          <path
            d="M200,100 Q400,50 600,150 T1000,100 Q1200,80 1400,200"
            stroke="url(#lineGradient1)"
            strokeWidth="1"
            fill="none"
            className="animate-pulse"
            style={{animationDelay: '3s'}}
            strokeDasharray="6 3"
          />
          
          {/* Additional flowing curves for more depth */}
          <path
            d="M-200,300 Q100,150 300,250 T700,200 Q900,180 1200,300"
            stroke="url(#lineGradient2)"
            strokeWidth="1"
            fill="none"
            className="animate-pulse"
            style={{animationDelay: '4s'}}
            strokeDasharray="4 6"
          />
        </svg>
        
        {/* Gradient Overlays */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-blue-500/10 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/5 via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <Card className="bg-[#212d3d]/80 backdrop-blur-sm border-gray-800/50 p-6 sm:p-8 text-center max-w-lg w-full relative z-10 mx-4" data-testid="matching-screen">
        {renderLoadingAnimation()}
        
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          {matching ? 'Finding Your Senpai' : 'Ready to Connect?'}
        </h2>
        
        <p className="text-gray-300 mb-4 text-sm sm:text-base leading-relaxed px-2">
          {matching ? searchText : 'Join thousands of anime fans and find your perfect match'}
        </p>
        
        {renderConnectionStatus()}
        {renderStats()}
        
        {!matching ? (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-6">
              <Badge className="bg-blue-500/20 text-blue-300 text-xs sm:text-sm px-2 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Smart Matching
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 text-xs sm:text-sm px-2 py-1">
                <Star className="h-3 w-3 mr-1" />
                Safe Community
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 text-xs sm:text-sm px-2 py-1">
                <Heart className="h-3 w-3 mr-1" />
                Anime Lovers
              </Badge>
            </div>
            
            <Button
              onClick={onStartMatching}
              disabled={!socketConnected}
              size="lg"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 sm:px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              data-testid="begin-matching-btn"
            >
              {socketConnected ? (
                <>
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Start Matching
                </>
              ) : (
                'Connecting...'
              )}
            </Button>
            
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                onClick={onCancel}
                variant="outline"
                className="px-6 sm:px-8 py-2 border-red-500/50 hover:bg-red-500/10 text-red-300 hover:text-red-200 text-sm sm:text-base"
                data-testid="cancel-matching-btn"
              >
                Cancel Search
              </Button>
            </div>
            
            {renderMatchingTips()}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
};

export default MatchingScreen;