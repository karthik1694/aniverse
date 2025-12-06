import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { axiosInstance } from '../api/axiosInstance';
import { toast } from 'sonner';
import { MessageCircle, Users, Plus, Settings, LogOut, Crown, Menu } from 'lucide-react';
import UserArc from './UserArc';
import PremiumUpgrade from './PremiumUpgrade';
import ArcProgressionNotification from './ArcProgressionNotification';
import UserAvatar from './UserAvatar';
import ClaimAccountBanner from './ClaimAccountBanner';
import SettingsModal from './SettingsModal';
import { isAnonymousUser, clearAnonymousSession } from '../utils/anonymousAuth';
import io from 'socket.io-client';
import React from 'react';

export default function MainLayout({ user, setUser, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('chat');
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Use ref to store current user for socket callbacks
  const userRef = React.useRef(user);
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Helper function to check if a user is online based on real-time data
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };


  useEffect(() => {
    // Initialize socket connection for arc progression notifications and real-time updates
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const newSocket = io(BACKEND_URL, {
      path: '/api/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket for arc progression and real-time updates');
      // Register this user for global notifications and online status
      if (user) {
        newSocket.emit('register_for_notifications', {
          user_id: user.id,
          user_data: user
        });
        // Request current online users list
        newSocket.emit('get_online_users');
      }
    });

    // Listen for online users updates
    newSocket.on('online_users_update', (onlineUsersList) => {
      console.log('Online users update:', onlineUsersList);
      setOnlineUsers(new Set(onlineUsersList));
    });

    // Listen for user online status changes
    newSocket.on('user_online', (userId) => {
      console.log('User came online:', userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', (userId) => {
      console.log('User went offline:', userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('direct_message_received', (messageData) => {
      console.log('MainLayout received message:', messageData);
      // Update unread counts when a new message is received
      if (activeTab === 'chat') {
        setTimeout(() => {
          loadDirectMessages();
        }, 100); // Small delay to ensure message is saved to DB
      }
    });

    // Listen for new message notifications (when user is not in the chat room)
    newSocket.on('new_message_notification', (notificationData) => {
      console.log('MainLayout received notification:', notificationData);
      
      // Show a toast notification
      toast.info(`New message from ${notificationData.from_user_name}: ${notificationData.message_preview}`, {
        duration: 4000,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to the chat with this user
            setActiveTab('chat');
            // The chat list will be updated automatically
          }
        }
      });
      
      // Update unread counts immediately
      if (activeTab === 'chat') {
        setTimeout(() => {
          loadDirectMessages();
        }, 100); // Small delay to ensure message is saved to DB
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket');
    });
    
    // Listen for real-time friend requests
    newSocket.on('friend_request_received', async (data) => {
      console.log('📨 Real-time friend request received:', data);
      toast.info(`👋 ${data.from_user.name} sent you a friend request!`);
      // Reload friend requests using current user from ref
      try {
        const currentUser = userRef.current;
        const params = currentUser?.isAnonymous ? { user_id: currentUser?.id } : {};
        const response = await axiosInstance.get('friend-requests', { params });
        console.log('✅ Friend requests reloaded:', response.data);
        setFriendRequests(response.data);
      } catch (error) {
        console.error('❌ Error reloading friend requests:', error);
      }
    });
    
    // Listen for friend request accepted (when someone accepts your request)
    newSocket.on('friend_request_accepted', async (data) => {
      console.log('✅ Friend request accepted:', data);
      toast.success(`🎉 ${data.friend.name} accepted your friend request!`);
      // Add to notifications
      setNotifications(prev => [{
        id: Date.now(),
        type: 'friend_accepted',
        message: `${data.friend.name} accepted your friend request!`,
        user: data.friend,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);
      // Reload friends list using current user from ref
      try {
        const currentUser = userRef.current;
        const params = currentUser?.isAnonymous ? { user_id: currentUser?.id } : {};
        const response = await axiosInstance.get('friends', { params });
        setFriends(response.data);
      } catch (error) {
        console.error('❌ Error reloading friends:', error);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []); // Remove activeTab dependency to prevent reconnections

  // Separate useEffect to handle tab changes
  useEffect(() => {
    console.log('📑 Active tab changed to:', activeTab);
    if (activeTab === 'friends') {
      console.log('🔄 Loading friends and friend requests...');
      loadFriends();
      loadFriendRequests();
    } else if (activeTab === 'chat') {
      console.log('🔄 Loading direct messages...');
      loadDirectMessages();
    }
  }, [activeTab, user]); // Add user as dependency to reload when user changes

  const loadFriends = async () => {
    try {
      // For anonymous users, pass user_id as query parameter
      const params = user?.isAnonymous ? { user_id: user.id } : {};
      const response = await axiosInstance.get('friends', { params });
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      // For anonymous users, pass user_id as query parameter
      const params = user?.isAnonymous ? { user_id: user.id } : {};
      console.log('📥 Loading friend requests:', {
        isAnonymous: user?.isAnonymous,
        userId: user?.id,
        userName: user?.name,
        params
      });
      const response = await axiosInstance.get('friend-requests', { params });
      console.log('✅ Friend requests loaded:', response.data);
      setFriendRequests(response.data);
    } catch (error) {
      console.error('❌ Error loading friend requests:', error.response?.data || error);
    }
  };

  const loadDirectMessages = async () => {
    try {
      console.log('Loading direct messages...');
      
      // Get friends and their latest messages
      const params = user?.isAnonymous ? { user_id: user.id } : {};
      const friendsResponse = await axiosInstance.get('friends', { params });
      const friendsList = friendsResponse.data;
      console.log('Friends list:', friendsList);
      
      // Get unread counts for all friends
      const unreadCountsResponse = await axiosInstance.get('unread-counts', { params });
      const unreadCounts = unreadCountsResponse.data;
      console.log('Unread counts:', unreadCounts);
      
      const conversations = [];
      for (const friend of friendsList) {
        try {
          const messagesResponse = await axiosInstance.get(`direct-messages/${friend.id}`, { params });
          const messagesData = messagesResponse.data;
          const messages = messagesData.messages || messagesData;
          
          if (Array.isArray(messages) && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const unreadCount = unreadCounts[friend.id] || 0;
            console.log(`Friend ${friend.name}: ${unreadCount} unread messages`);
            
            conversations.push({
              friend,
              lastMessage,
              unreadCount
            });
          }
        } catch (error) {
          console.error(`Error loading messages for friend ${friend.id}:`, error);
        }
      }
      
      // Sort by last message timestamp
      conversations.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
      console.log('Final conversations:', conversations);
      setDirectMessages(conversations);
    } catch (error) {
      console.error('Error loading direct messages:', error);
    }
  };

  const handleFriendClick = async (friend) => {
    // Prevent users from trying to chat with themselves
    if (friend.id === user.id) {
      toast.error('You cannot chat with yourself');
      return;
    }
    
    // Mark messages as read when opening chat
    try {
      await axiosInstance.post(`mark-messages-read/${friend.id}`);
      // Refresh direct messages to update unread counts
      if (activeTab === 'chat') {
        loadDirectMessages();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
    
    // Navigate to direct chat with friend
    navigate(`/direct-chat/${friend.id}`);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      // Always include user data in the request as a fallback for authentication
      const requestBody = { user_data: user };
      await axiosInstance.post(`friend-requests/${requestId}/accept`, requestBody);
      toast.success('Friend request accepted!');
      loadFriends();
      loadFriendRequests();
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
      toast.success('Friend request rejected');
      loadFriendRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all local storage and session data first
      clearAnonymousSession();
      localStorage.clear();
      sessionStorage.clear();
      
      // Check if user is anonymous
      if (isAnonymousUser(user)) {
        setUser(null);
        // Force full page reload to ensure clean state (same as OAuth logout)
        window.location.href = '/';
        return;
      }
      
      // Regular OAuth logout
      try {
        await axiosInstance.post('auth/logout');
      } catch (e) {
        // Ignore errors on logout API call
        console.log('Logout API error (ignored):', e);
      }
      
      setUser(null);
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout anyway
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      window.location.href = '/';
    }
  };

  const handleClaimAccount = () => {
    // Redirect to OAuth login to claim the account
    const redirectUrl = `${window.location.origin}/`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] text-white flex flex-col overflow-hidden">
      {/* Claim Account Banner for Anonymous Users */}
      {isAnonymousUser(user) && (
        <ClaimAccountBanner 
          onClaim={handleClaimAccount}
        />
      )}
      
      <div className="flex-1 flex overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#1a1a2e]/95 backdrop-blur-sm border-b border-gray-800/50 z-50 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold text-white">
              New Chat
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1.5"
              onClick={() => setActiveTab('friends')}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1.5"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f1419] border-r border-gray-800/50 flex flex-col">
            {/* Mobile Sidebar Content - Same as desktop sidebar */}
            <div className="p-4 border-b border-gray-800/50">
              <h1 className="text-xl font-bold text-white">
                otakucafe<span className="text-sm text-gray-400">.fun</span>
              </h1>
            </div>

            {/* Navigation Tabs */}
            <div className="p-3 border-b border-gray-800/50">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  className={`flex-1 ${
                    activeTab === 'chat'
                      ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveTab('chat');
                    setMobileMenuOpen(false);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                <Button
                  variant={activeTab === 'friends' ? 'default' : 'ghost'}
                  className={`flex-1 ${
                    activeTab === 'friends'
                      ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveTab('friends');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Friends
                </Button>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* New Chat Button */}
              <Button
                className="w-full justify-start bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={() => {
                  navigate('/chat');
                  setMobileMenuOpen(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>

              {/* Dynamic Content Section - Same as desktop */}
              <div className="pt-4">
                {activeTab === 'friends' ? (
                  <div>
                    {/* Friends List */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                        Friends ({friends.length})
                      </h3>
                      {friends.length > 0 ? (
                        <div className="space-y-2 px-3">
                          {friends.map((friend) => (
                            <div
                              key={friend.id}
                              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                              onClick={() => {
                                handleFriendClick(friend);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <UserAvatar user={friend} size="sm" />
                                  {isUserOnline(friend.id) ? (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-[#0f1419] rounded-full"></div>
                                  ) : (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-500 border border-[#0f1419] rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white truncate text-xs">{friend.name}</p>
                                  {friend.favorite_anime.length > 0 && (
                                    <p className="text-xs text-gray-400 truncate">
                                      Likes: {friend.favorite_anime.slice(0, 2).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  💬
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                          <Users className="h-8 w-8 mb-2 text-gray-600" />
                          <p className="text-xs text-gray-400">
                            No friends yet. Start matching to make connections!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                      Direct Messages
                    </h3>
                    {directMessages.length > 0 ? (
                      <div className="space-y-2 px-3">
                        {directMessages.map((conversation) => (
                          <div
                            key={conversation.friend.id}
                            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                            onClick={() => {
                              handleFriendClick(conversation.friend);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <UserAvatar user={conversation.friend} size="sm" />
                                {isUserOnline(conversation.friend.id) ? (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-[#0f1419] rounded-full"></div>
                                ) : (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-500 border border-[#0f1419] rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate text-xs">{conversation.friend.name}</p>
                                <p className="text-xs text-gray-400 truncate">
                                  {conversation.lastMessage.message.length > 30
                                    ? conversation.lastMessage.message.substring(0, 30) + '...'
                                    : conversation.lastMessage.message
                                  }
                                </p>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="bg-cyan-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-xs text-gray-400">
                          No direct messages yet. Click on friends to start chatting!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Premium Section */}
            <div className="p-3 border-t border-gray-800/50">
              {user.premium ? (
                <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/20 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-bold text-yellow-400 text-sm">Premium Active</h3>
                  </div>
                  <p className="text-xs text-gray-300 mb-3">
                    You're enjoying all premium features! 🎉
                  </p>
                  <div className="text-xs text-yellow-300">
                    ✨ Unlimited matches<br/>
                    ✨ Priority matching<br/>
                    ✨ Extended video chat
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/20 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-bold text-yellow-400 text-sm">Go Premium</h3>
                  </div>
                  <p className="text-xs text-gray-300 mb-3">
                    Unlock exclusive features and support the platform
                  </p>
                  <Button
                    onClick={() => {
                      setShowPremiumUpgrade(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold text-xs"
                  >
                    Upgrade Now
                  </Button>
                </div>
              )}
            </div>

            {/* User Arc Section */}
            <div className="p-3 border-t border-gray-800/50">
              <UserArc compact={true} />
            </div>

            {/* User Profile Section */}
            <div className="p-3 border-t border-gray-800/50 bg-[#0f1419]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <UserAvatar user={user} size="md" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0f1419] rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">Online</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-white/5"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-white/5"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-gradient-to-b from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f1419]/95 backdrop-blur-sm border-r border-gray-800/50 flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800/50">
          <h1 className="text-xl font-bold text-white">
            otakucafe<span className="text-sm text-gray-400">.fun</span>
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 border-b border-gray-800/50">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              className={`flex-1 ${
                activeTab === 'chat'
                  ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button
              variant={activeTab === 'friends' ? 'default' : 'ghost'}
              className={`flex-1 ${
                activeTab === 'friends'
                  ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setActiveTab('friends')}
            >
              <Users className="h-4 w-4 mr-2" />
              Friends
            </Button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* New Chat Button */}
          <Button
            className="w-full justify-start bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={() => navigate('/chat')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>



          {/* Dynamic Content Section */}
          <div className="pt-4">
            {activeTab === 'friends' ? (
              <div>
                {/* Friends List */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                    Friends ({friends.length})
                  </h3>
                  {friends.length > 0 ? (
                    <div className="space-y-2 px-3">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                          onClick={() => handleFriendClick(friend)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <UserAvatar user={friend} size="sm" />
                              {/* Online status indicator - consistent based on user ID */}
                              {isUserOnline(friend.id) ? (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-[#0f1419] rounded-full"></div>
                              ) : (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-500 border border-[#0f1419] rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate text-xs">{friend.name}</p>
                              {friend.favorite_anime.length > 0 && (
                                <p className="text-xs text-gray-400 truncate">
                                  Likes: {friend.favorite_anime.slice(0, 2).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              💬
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                      <Users className="h-8 w-8 mb-2 text-gray-600" />
                      <p className="text-xs text-gray-400">
                        No friends yet. Start matching to make connections!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  Direct Messages
                </h3>
                {directMessages.length > 0 ? (
                  <div className="space-y-2 px-3">
                    {directMessages.map((conversation) => (
                      <div
                        key={conversation.friend.id}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => handleFriendClick(conversation.friend)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <UserAvatar user={conversation.friend} size="sm" />
                            {/* Online status indicator - consistent based on user ID */}
                            {isUserOnline(conversation.friend.id) ? (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-[#0f1419] rounded-full"></div>
                            ) : (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-500 border border-[#0f1419] rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate text-xs">{conversation.friend.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {conversation.lastMessage.message.length > 30
                                ? conversation.lastMessage.message.substring(0, 30) + '...'
                                : conversation.lastMessage.message
                              }
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-cyan-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-3">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-xs text-gray-400">
                      No direct messages yet. Click on friends to start chatting!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Premium Section */}
        <div className="p-3 border-t border-gray-800/50">
          {user.premium ? (
            <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/20 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h3 className="font-bold text-yellow-400 text-sm">Premium Active</h3>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                You're enjoying all premium features! 🎉
              </p>
              <div className="text-xs text-yellow-300">
                ✨ Unlimited matches<br/>
                ✨ Priority matching<br/>
                ✨ Extended video chat
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/20 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h3 className="font-bold text-yellow-400 text-sm">Go Premium</h3>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Unlock exclusive features and support the platform
              </p>
              <Button
                onClick={() => setShowPremiumUpgrade(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold text-xs"
              >
                Upgrade Now
              </Button>
            </div>
          )}
        </div>

        {/* User Arc Section */}
        <div className="p-3 border-t border-gray-800/50">
          <UserArc compact={true} />
        </div>

        {/* User Profile Section */}
        <div className="p-3 border-t border-gray-800/50 bg-[#0f1419]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar user={user} size="md" />
              {/* Current user is always online */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0f1419] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">Online</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/5"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-4 w-4 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/5"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col pt-12 md:pt-0">
        {React.isValidElement(children)
          ? React.cloneElement(children, { 
              openSettings: () => setShowSettingsModal(true),
              openMenu: () => setMobileMenuOpen(true),
              notifications: notifications,
              clearNotification: (id) => setNotifications(prev => prev.filter(n => n.id !== id)),
              markNotificationRead: (id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n))
            })
          : children}
      </div>

      {/* Premium Upgrade Modal */}
      {showPremiumUpgrade && (
        <PremiumUpgrade
          user={user}
          setUser={setUser}
          onClose={() => setShowPremiumUpgrade(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          user={user}
          setUser={setUser}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Arc Progression Notification */}
      <ArcProgressionNotification socket={socket} />
      </div>
    </div>
  );
}