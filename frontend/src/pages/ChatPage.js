import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { axiosInstance } from '../api/axiosInstance';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { Send, UserPlus, X, ArrowLeft, Loader2, Filter, Flag, Image } from 'lucide-react';
import ArcProgressionNotification from '../components/ArcProgressionNotification';
import MatchingScreen from '../components/MatchingScreen';
import TypingIndicator from '../components/TypingIndicator';
import UserAvatar from '../components/UserAvatar';
import SearchFilters from '../components/SearchFilters';
import EmojiPicker from '../components/EmojiPicker';
import ReportUserModal from '../components/ReportUserModal';
import GenderSelectionModal from '../components/GenderSelectionModal';
import InterestsSelectionModal from '../components/InterestsSelectionModal';
import Dashboard from './Dashboard';
import { watchlist } from '../utils/watchlist';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * "+N" overflow chip that reveals the hidden items in a popover.
 * Opens on hover (desktop) and on tap (mobile) — touch devices don't hover.
 */
function OverflowChip({ extra, hiddenItems, cls }) {
  const [open, setOpen] = useState(false);
  const remaining = extra - hiddenItems.length; // items beyond what we received

  const handleEnter = (e) => { if (e.pointerType !== 'touch') setOpen(true); };
  const handleLeave = (e) => { if (e.pointerType !== 'touch') setOpen(false); };

  return (
    <span className="relative inline-block" onPointerEnter={handleEnter} onPointerLeave={handleLeave}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-inline text-xs px-2 py-0.5 rounded-md border border-white/10 text-gray-300 bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors"
      >
        +{extra}
      </button>
      {open && hiddenItems.length > 0 && (
        <>
          {/* tap-catcher so tapping elsewhere closes it on touch devices */}
          <span className="fixed inset-0 z-[85]" onClick={() => setOpen(false)} />
          <span className="absolute z-[90] left-0 top-full mt-1 w-max max-w-[70vw] sm:max-w-[260px] bg-[#11151f] border border-white/10 rounded-lg shadow-2xl p-2 flex flex-wrap gap-1">
            {hiddenItems.map((it, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-md border ${cls} max-w-[180px] truncate`} title={it}>
                {it}
              </span>
            ))}
            {remaining > 0 && <span className="text-xs px-2 py-0.5 text-gray-400">+{remaining} more</span>}
          </span>
        </>
      )}
    </span>
  );
}

export default function ChatPage({ user, setUser, openSettings, openMenu, notifications, clearNotification, markNotificationRead }) {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [partner, setPartner] = useState(null);
  const [compatibility, setCompatibility] = useState(0);
  const [sharedUniverse, setSharedUniverse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [matchingStats, setMatchingStats] = useState({ totalUsers: 0, activeMatchers: 0 });
    const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [showSkippedNotification, setShowSkippedNotification] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false); // Track if request was sent to current partner
    const [sendingFriendRequest, setSendingFriendRequest] = useState(false); // Prevent double-click
  const [showDashboard, setShowDashboard] = useState(true);
  const [showGenderGate, setShowGenderGate] = useState(false);
  const [showInterestsGate, setShowInterestsGate] = useState(false);
  const fileInputRef = useRef(null);

  // Dynamic usernames and avatars
  const currentUser = {
    name: user?.name || "You",
    avatar: user?.picture ? "👤" : "😊",
    color: "#7dd3fc" // Light blue for current user
  };

  const partnerUser = {
    name: partner?.name || "Partner",
    avatar: partner?.picture ? "👤" : "🙂",
    color: "#22d3ee" // Cyan for partner
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log('Connecting to Socket.IO at:', BACKEND_URL);
    const newSocket = io(BACKEND_URL, {
      path: '/api/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
      autoConnect: true,
      withCredentials: true
    });

    // Set socket immediately so it's available when connected
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✓ Connected to server, socket ID:', newSocket.id);
      setSocketConnected(true);
      toast.success('Connected to server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('✗ Connection error:', error.message);
      setSocketConnected(false);
      toast.error(`Connection failed: ${error.message}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server. Reason:', reason);
      setSocketConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Socket error occurred');
      }
    });

    newSocket.on('searching', () => {
      console.log('✓ Received "searching" event from server');
      setMatching(true);
      toast.info('Added to matching queue');
    });

    newSocket.on('match_found', (data) => {
      console.log('Match found:', data);
      setPartner(data.partner);
      setCompatibility(data.compatibility);
      setSharedUniverse(data.shared_universe);
      setMatched(true);
      setMatching(false);
      toast.success(`Matched with ${data.partner.name}!`);
    });

    newSocket.on('receive_message', (data) => {
      console.log('Received message:', { hasImage: !!data.image, message: data.message, data });
      setMessages(prev => [...prev, {
        ...data,
        type: 'received',
        timestamp: data.timestamp || new Date().toISOString()
      }]);
    });

    newSocket.on('message_sent', (data) => {
      console.log('Message sent confirmation:', { hasImage: !!data.image, message: data.message, data });
      setMessages(prev => [...prev, {
        ...data,
        type: 'sent',
        timestamp: data.timestamp || new Date().toISOString()
      }]);
    });

    newSocket.on('partner_disconnected', () => {
      toast.error('Partner disconnected');
      handleLeaveChat();
    });

    newSocket.on('partner_left', () => {
      setShowSkippedNotification(true);
      handleLeaveChat();
    });

    newSocket.on('partner_skipped', () => {
      console.log('Partner skipped, continuing search...');
      setSkipCount(prev => prev + 1);
      toast.info('Partner skipped - finding another match...');
      setMatched(false);
      setPartner(null);
      setMessages([]);
      // Continue matching automatically
      setMatching(true);
    });

    newSocket.on('you_were_skipped', () => {
      console.log('You were skipped, continuing search...');
      setSkipCount(prev => prev + 1);
      toast.info('Searching for another match...');
      setMatched(false);
      setPartner(null);
      setMessages([]);
      // Continue matching automatically
      setMatching(true);
    });

    newSocket.on('matching_stats', (stats) => {
      console.log('Received matching stats:', stats);
      setMatchingStats(stats);
    });

    newSocket.on('online_users_update', (onlineUserIds) => {
      console.log('Online users update:', onlineUserIds.length, 'users online');
      setOnlineUsersCount(onlineUserIds.length);
    });

    newSocket.on('search_timeout', () => {
      console.log('Search timeout, retrying...');
      toast.warning('Taking longer than usual - expanding search...');
      // Don't stop matching, just show the message
    });

    newSocket.on('partner_typing_start', (data) => {
      console.log('Partner started typing:', data);
      setPartnerTyping(true);
    });

    newSocket.on('partner_typing_stop', () => {
      console.log('Partner stopped typing');
      setPartnerTyping(false);
    });

    return () => {
      // Clean up typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Reset friend request sent flag when partner changes and check for existing requests
  useEffect(() => {
    setFriendRequestSent(false);
    setSendingFriendRequest(false);
    
    // Check if there's already a pending friend request with this partner
    const checkExistingRequest = async () => {
      if (!partner?.id || !user?.id) return;
      
      try {
        // Check if we already sent a request to this partner or they sent one to us
        const params = user?.isAnonymous ? { user_id: user?.id } : {};
        const response = await axiosInstance.get('friend-requests', { params });
        const pendingRequests = response.data || [];
        
        // Check if there's already a request involving this partner
        const existingRequest = pendingRequests.find(
          req => req.from_user?.id === partner.id || req.request?.to_user_id === partner.id
        );
        
        if (existingRequest) {
          console.log('Found existing friend request with partner:', existingRequest);
          setFriendRequestSent(true);
        }
        
        // Also check sent requests
        try {
          const sentResponse = await axiosInstance.get('friend-requests/sent', { params });
          const sentRequests = sentResponse.data || [];
          const sentToPartner = sentRequests.find(req => req.to_user_id === partner.id);
          if (sentToPartner) {
            console.log('Found sent friend request to partner:', sentToPartner);
            setFriendRequestSent(true);
          }
        } catch (e) {
          // Endpoint might not exist, that's ok
        }
        
        // Check if already friends
        try {
          const friendsResponse = await axiosInstance.get('friends', { params });
          const friends = friendsResponse.data || [];
          const isAlreadyFriend = friends.find(f => f.id === partner.id);
          if (isAlreadyFriend) {
            console.log('Already friends with partner');
            setFriendRequestSent(true);
          }
        } catch (e) {
          // Ignore errors
        }
      } catch (error) {
        console.log('Could not check existing friend requests:', error.message);
      }
    };
    
    checkExistingRequest();
  }, [partner, user]);

  const handleStartMatching = (matchUserArg) => {
    // Accept an explicit user (from the gender/interests gate) but stay safe
    // when used directly as a click handler (where the arg is an event).
    const matchUser = matchUserArg && matchUserArg.id ? matchUserArg : user;
    console.log('Starting matching...', { 
      socket: !!socket, 
      socketConnected, 
      socket_id: socket?.id,
      user_id: matchUser?.id,
      user_name: matchUser?.name,
      filters: searchFilters
    });
    
    if (!socket) {
      toast.error('Socket not initialized. Please refresh the page.');
      return;
    }

    if (!socketConnected) {
      toast.error('Not connected to server. Connecting...');
      socket.connect();
      setTimeout(() => {
        if (socket.connected) {
          handleStartMatching(matchUser);
        }
      }, 2000);
      return;
    }

    console.log('Emitting join_matching event with data:', {
      user_id: matchUser.id,
      user_name: matchUser.name,
      filters: searchFilters
    });
    
    socket.emit('join_matching', {
      user_id: matchUser.id,
      user_data: matchUser,
      filters: searchFilters,
      watch_profile: watchlist.matchProfile()
    });
    
    toast.info('Searching for a match...');
    setMatching(true);
    setSkipCount(0); // Reset skip count when starting new search
  };

  // --- Gender + interests gate (collected here, inside the Chat flow) ---
  const persistProfile = async (changes) => {
    let updated = { ...user, ...changes };
    if (user?.isAnonymous) {
      localStorage.setItem('anonymous_user', JSON.stringify(updated));
    } else {
      try {
        const res = await axiosInstance.put('profile', { ...user, ...changes });
        updated = res.data;
      } catch (e) {
        console.error('Failed to persist profile, using local copy', e);
      }
    }
    if (setUser) setUser(updated);
    return updated;
  };

  const proceedToMatch = (matchUser) => {
    setShowDashboard(false);
    setTimeout(() => handleStartMatching(matchUser), 50);
  };

  // Entry point when the user wants to talk to strangers.
  // Collects gender (required) + interests before matching.
  const beginMatchFlow = () => {
    if (!user?.gender) {
      setShowGenderGate(true);
      return;
    }
    proceedToMatch(user);
  };

  const handleGenderSelected = async (gender) => {
    const updated = await persistProfile({ gender });
    setShowGenderGate(false);
    const hasInterests =
      (updated.favorite_genres?.length || 0) + (updated.favorite_themes?.length || 0) > 0;
    if (!hasInterests) {
      setShowInterestsGate(true);
    } else {
      proceedToMatch(updated);
    }
  };

  const handleGenderGateClose = () => {
    setShowGenderGate(false);
  };

  const handleInterestsGateComplete = async (interests) => {
    const updated = await persistProfile({
      favorite_genres: interests.favorite_genres || [],
      favorite_themes: interests.favorite_themes || [],
    });
    setShowInterestsGate(false);
    proceedToMatch(updated);
  };

  const handleInterestsGateClose = () => {
    setShowInterestsGate(false);
    // Allow matching even if they skip choosing interests
    proceedToMatch(user);
  };

  const handleCancelMatching = () => {
    console.log('Canceling matching...');
    if (socket && socket.connected) {
      socket.emit('cancel_matching');
    }
    setMatching(false);
    setMatched(false);
    setPartner(null);
    setMessages([]);
    toast.info('Search canceled');
  };

  const handleSkipPartner = () => {
    console.log('Skipping current partner...');
    if (socket && socket.connected) {
      socket.emit('skip_partner');
    }
    // Reset chat state and start searching again
    setMatched(false);
    setPartner(null);
    setMessages([]);
    setCompatibility(0);
    setSharedUniverse(null);
    setMatching(true); // Continue searching
    toast.info('Skipped - finding another match...');
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && socket) {
      // Stop typing indicator when sending message
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      socket.emit('typing_stop');
      
      socket.emit('send_message', { message: messageInput });
      setMessageInput('');
    }
  };

  const handleTypingStart = () => {
    if (socket && socket.connected) {
      // Clear existing timeout first
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      } else {
        // Only emit typing_start if this is a new typing session
        socket.emit('typing_start');
      }
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        socket.emit('typing_stop');
        setTypingTimeout(null);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleTypingStop = () => {
    if (socket && socket.connected) {
      socket.emit('typing_stop');
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Emit typing indicator on every keystroke (with debounce via timeout)
    if (value.trim()) {
      handleTypingStart();
    } else if (typingTimeout) {
      // If input becomes empty, stop typing indicator
      handleTypingStop();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage({
          file,
          preview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendWithImage = async () => {
    if (!selectedImage && !messageInput.trim()) return;
    
    // Stop typing indicator when sending message
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    if (socket && socket.connected) {
      socket.emit('typing_stop');
    }
    
    try {
      if (selectedImage) {
        // Convert image to base64 and send
        const message = messageInput.trim() || 'Sent an image';
        console.log('Sending message with image:', { 
          message, 
          imageSize: selectedImage.preview.length,
          imagePreview: selectedImage.preview.substring(0, 100) + '...'
        });
        socket.emit('send_message', { 
          message,
          image: selectedImage.preview
        });
        handleRemoveImage();
        setMessageInput('');
      } else {
        handleSendMessage();
      }
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Failed to send image');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!partner) {
      console.error('❌ No partner found for friend request');
      toast.error('No chat partner found');
      return;
    }
    
    if (!partner.id) {
      console.error('❌ Partner has no ID:', partner);
      toast.error('Cannot identify chat partner');
      return;
    }
    
    if (!user) {
      console.error('❌ No user found for friend request');
      toast.error('Please log in to send friend requests');
      return;
    }
    
    // Prevent double-click
    if (sendingFriendRequest || friendRequestSent) {
      console.log('Friend request already in progress or sent');
      return;
    }
    
    setSendingFriendRequest(true);
    
    try {
      // Always include user data in the request as a fallback for authentication
      // This ensures friend requests work even if session cookies aren't sent properly
      const requestBody = { user_data: user };
      
      console.log('🔵 Sending friend request:', {
        partner_id: partner.id,
        partner_name: partner.name,
        user_id: user?.id,
        user_name: user?.name,
        isAnonymous: user?.isAnonymous,
        requestBody: requestBody
      });
      
      const response = await axiosInstance.post(`friend-requests/${partner.id}`, requestBody);
      console.log('✅ Friend request response:', response.data);
      setFriendRequestSent(true); // Mark as sent
      toast.success('👋 Friend request sent!');
    } catch (error) {
      console.error('❌ Friend request error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      // Check if already sent or already friends
      if (error.response?.data?.detail?.includes('already sent') || error.response?.data?.detail?.includes('Request already sent')) {
        setFriendRequestSent(true);
        toast.info('Friend request already sent');
      } else if (error.response?.data?.detail?.includes('Already friends')) {
        setFriendRequestSent(true);
        toast.info('Already friends with this user');
      } else if (error.response?.data?.detail?.includes('already sent you')) {
        setFriendRequestSent(true);
        toast.info('This user has already sent you a friend request! Check your notifications.');
      } else if (error.response?.status === 503) {
        toast.error('Server is temporarily unavailable. Please try again.');
      } else if (error.response?.status === 404) {
        toast.error('User not found. They may have disconnected.');
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to send friend request');
      }
    } finally {
      setSendingFriendRequest(false);
    }
  };

  const handleLeaveChat = () => {
    try {
      // Clean up typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      if (socket && socket.connected) {
        socket.emit('typing_stop');
        socket.emit('leave_chat');
      }
      // Show notification when user leaves
      setShowSkippedNotification(true);
      // Reset chat state
      setMatched(false);
      setPartner(null);
      setMessages([]);
      setPartnerTyping(false);
    } catch (error) {
      console.error('Error leaving chat:', error);
    } finally {
      // Don't navigate immediately, let user see the notification
      // navigate('/chat');
    }
  };

  const handleBackToMatching = () => {
    setShowSkippedNotification(false);
    setMatched(false);
    setPartner(null);
    setMessages([]);
    setShowDashboard(true);
    // Optionally start matching again automatically
    // handleStartMatching();
  };

  // Show dashboard first before matching
  if (showDashboard && !matching && !matched) {
    return (
      <>
        <Dashboard 
          user={user} 
          onStartChat={beginMatchFlow}
          onManageInterests={openSettings}
          onOpenMenu={openMenu}
          notifications={notifications}
          clearNotification={clearNotification}
          markNotificationRead={markNotificationRead}
        />
        <GenderSelectionModal
          isOpen={showGenderGate}
          onClose={handleGenderGateClose}
          onGenderSelect={handleGenderSelected}
        />
        <InterestsSelectionModal
          isOpen={showInterestsGate}
          onClose={handleInterestsGateClose}
          onComplete={handleInterestsGateComplete}
        />
      </>
    );
  }

  if (!matched) {
    return (
      <>
        <MatchingScreen
          matching={matching}
          socketConnected={socketConnected}
          onStartMatching={handleStartMatching}
          onCancel={handleCancelMatching}
          onBack={() => navigate('/dashboard')}
          onOpenMenu={openMenu}
          user={user}
          notifications={notifications}
          clearNotification={clearNotification}
          markNotificationRead={markNotificationRead}
          matchingStats={matchingStats}
                    onlineUsersCount={onlineUsersCount}
        />
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 md:relative md:h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] z-[60] md:z-auto">
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
        
        {/* AniChat Header */}
        <div className="flex-shrink-0 bg-[#212d3d]/80 backdrop-blur-sm border-b border-gray-800/50 px-2 sm:px-3 md:px-4 py-2 sm:py-3 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <Button
                onClick={handleLeaveChat}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 sm:p-1.5 md:p-2"
                data-testid="leave-chat-btn"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <div className="text-white font-medium text-xs sm:text-sm md:text-base">
                # anime-chat
              </div>
            </div>
            <div className="flex gap-0.5 sm:gap-1 md:gap-2">
              <Button
                onClick={handleSendFriendRequest}
                disabled={friendRequestSent || sendingFriendRequest}
                variant="ghost"
                size="sm"
                className={`p-1 sm:p-1.5 md:p-2 ${
                  friendRequestSent 
                    ? 'text-green-400 cursor-default' 
                    : sendingFriendRequest
                    ? 'text-yellow-400 cursor-wait'
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid="send-friend-request-btn"
                title={friendRequestSent ? 'Friend request sent!' : sendingFriendRequest ? 'Sending...' : 'Send friend request'}
              >
                {friendRequestSent ? (
                  <><UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> ✓</>
                ) : sendingFriendRequest ? (
                  <><UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" /></>
                ) : (
                  <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
              {/* Report button - hidden for now */}
              {/* <Button
                onClick={() => setShowReportModal(true)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-400 p-1 sm:p-1.5 md:p-2"
                title="Report User"
              >
                <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button> */}
              <Button
                onClick={handleSkipPartner}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs md:text-sm"
                data-testid="skip-partner-btn"
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative z-10">
          {/* AniChat Chat Interface */}
          <div className="bg-transparent h-full flex flex-col">
            {/* Skipped Chat Notification Banner */}
            {showSkippedNotification && (
              <div className="bg-red-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 border-b border-red-500/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 text-sm sm:text-base">⚠️</span>
                    <span className="text-white font-medium text-xs sm:text-sm">You have skipped this chat.</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <Button
                      onClick={() => {
                        // Handle report functionality
                        console.log('Report button clicked');
                        // You can add report logic here
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 h-auto rounded"
                    >
                      Report
                    </Button>
                    <Button
                      onClick={handleBackToMatching}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 h-auto rounded"
                    >
                      Back to Matching
                    </Button>
                    <Button
                      onClick={() => setShowSkippedNotification(false)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white p-1"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Match panel — shared watch data */}
            {sharedUniverse && (compatibility > 0 || sharedUniverse.match_watching?.length || sharedUniverse.match_completed?.length || sharedUniverse.match_shared?.length || sharedUniverse.match_genres?.length || sharedUniverse.shared_anime?.length || sharedUniverse.shared_genres?.length) && (
              <div className="bg-[#1e2936]/60 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-700/50">
                {/* Header: partner + match score */}
                <div className="flex items-center justify-between mb-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: partnerUser.color }}
                    >
                      {partnerUser.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight truncate">{partner?.name || 'Your match'}</p>
                      <p className="text-[10px] text-green-400 leading-tight">● online now</p>
                    </div>
                  </div>
                  {compatibility > 0 && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-3 py-1 rounded-full border border-cyan-500/40 flex-shrink-0">
                      <span className="text-sm">✨</span>
                      <span className="text-cyan-200 font-bold text-sm">{compatibility}%</span>
                      <span className="text-cyan-300/70 text-[10px]">match</span>
                    </div>
                  )}
                </div>

                {/* Shared watch data — what you actually have in common */}
                {(() => {
                  const su = sharedUniverse || {};
                  const counts = su.match_counts || {};
                  const groups = [
                    {
                      label: 'Both completed', icon: '✅',
                      cls: 'bg-green-500/15 text-green-200 border-green-500/30',
                      items: su.match_completed || [],
                      total: counts.completed,
                    },
                    {
                      label: 'Watching now', icon: '📺',
                      cls: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30',
                      items: su.match_watching || [],
                      total: counts.watching,
                    },
                    {
                      label: 'Top shared genres', icon: '🏷️',
                      cls: 'bg-purple-500/15 text-purple-200 border-purple-500/30',
                      items: su.match_genres || su.shared_genres || [],
                      total: counts.genres,
                    },
                    {
                      label: 'Also on both lists', icon: '🔗',
                      cls: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
                      items: su.match_shared || su.shared_anime || [],
                      total: counts.other,
                    },
                  ].filter((g) => g.items && g.items.length);

                  if (!groups.length) {
                    return (
                      <p className="text-xs text-gray-400">
                        No shared shows yet — say hi and find out what {partner?.name || 'they'} are watching! 👋
                      </p>
                    );
                  }

                  const MAX = 3;
                  return (
                    <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                      {groups.map((g) => {
                        const total = typeof g.total === 'number' ? g.total : g.items.length;
                        const extra = total - MAX;
                        return (
                          <div key={g.label} className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                              {g.icon} {g.label}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {g.items.slice(0, MAX).map((it, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-2 py-0.5 rounded-md border ${g.cls} max-w-[160px] truncate`}
                                  title={it}
                                >
                                  {it}
                                </span>
                              ))}
                              {extra > 0 && (
                                <OverflowChip extra={extra} hiddenItems={g.items.slice(MAX)} cls={g.cls} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Simple Match Banner (fallback) */}
            {(!sharedUniverse || (!sharedUniverse.conversation_starters?.length && compatibility === 0)) && (
              <div className="bg-[#212d3d]/80 backdrop-blur-sm px-3 sm:px-4 py-3 border-b border-gray-800/50">
                <div className="text-gray-300 text-xs sm:text-sm text-center">
                  You are now chatting with <span className="text-cyan-400 font-medium">{partner?.name || 'your match'}</span>. Say hi!
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4 py-2 space-y-1">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-4">
                    <div className="text-3xl mb-2">👋</div>
                    <p className="text-base sm:text-lg font-semibold text-white mb-1">
                      Say hi to {partner?.name || 'your match'}!
                    </p>
                    <p className="text-xs text-gray-500 mb-5 flex items-center justify-center gap-1.5">
                      <span className="text-green-400">🔒</span> Messages vanish when you skip or leave
                    </p>
                    {sharedUniverse?.conversation_starters?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">Break the ice</p>
                        {sharedUniverse.conversation_starters.slice(0, 3).map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMessageInput(prompt)}
                            className="w-full text-left bg-[#1e2936]/70 hover:bg-[#243044] px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-cyan-500/40 transition-all text-sm text-gray-200 group flex items-start gap-2"
                          >
                            <span className="text-cyan-400 mt-0.5 group-hover:scale-110 transition-transform">💬</span>
                            <span className="flex-1">{prompt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isCurrentUser = msg.type === 'sent';
                  const displayUser = isCurrentUser ? currentUser : partnerUser;
                  const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  
                  // Check if this message is from the same user as the previous one
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const isSameUser = prevMsg && prevMsg.type === msg.type;
                  
                  return (
                    <div key={index} className="flex items-start gap-2 sm:gap-3 px-1 sm:px-2 hover:bg-[#212d3d]/40 rounded group" style={{ paddingTop: isSameUser ? '2px' : '8px', paddingBottom: '2px' }}>
                      {/* Avatar - only show for first message in group */}
                      {!isSameUser ? (
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg flex-shrink-0"
                          style={{ backgroundColor: displayUser.color }}
                        >
                          {displayUser.avatar}
                        </div>
                      ) : (
                        <div className="w-8 sm:w-10 flex-shrink-0" /> // Spacer to maintain alignment
                      )}
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {/* Username and Timestamp - Only show for first message in group */}
                        {!isSameUser && (
                          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
                            <span className="font-semibold text-white text-xs sm:text-sm">
                              {displayUser.name}
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              {timestamp}
                            </span>
                          </div>
                        )}
                        
                        {/* Message Text */}
                        <div className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                          {msg.is_spoiler && (
                            <Badge className="bg-red-500/20 text-red-300 mb-2 text-xs">⚠️ Potential Spoiler</Badge>
                          )}
                          {msg.image && (
                            <img 
                              src={msg.image} 
                              alt="Shared image" 
                              className="rounded-lg max-w-[200px] sm:max-w-xs mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          )}
                          <p className={msg.is_spoiler ? 'blur-sm hover:blur-none transition-all cursor-pointer' : ''}>
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing Indicator */}
              <TypingIndicator
                isTyping={partnerTyping}
                userName={partner?.name || "Partner"}
              />
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
              {/* Image Preview - Outside of input container */}
              {selectedImage && (
                <div className="mb-2 relative inline-block">
                  <img 
                    src={selectedImage.preview} 
                    alt="Preview" 
                    className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border-2 border-cyan-500/30"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <div className="relative">
                <div className="bg-[#212d3d]/80 backdrop-blur-sm rounded-lg flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3">
                  {/* SKIP button - Inline at start */}
                  <Button
                    onClick={handleSkipPartner}
                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 h-auto rounded flex-shrink-0"
                    size="sm"
                  >
                    SKIP
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <Input
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (selectedImage) {
                            handleSendWithImage();
                          } else {
                            handleSendMessage();
                          }
                        }
                      }}
                      placeholder="Send a message"
                      className="bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 focus:outline-none p-0 h-auto text-sm sm:text-base w-full"
                      data-testid="message-input"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {/* Image upload button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-400 hover:text-white transition-colors p-1"
                      title="Upload image"
                    >
                      <Image className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      className="hidden sm:block text-gray-400 text-lg cursor-pointer hover:text-white transition-colors p-1"
                      type="button"
                      title="Emoji picker (mobile users: use your keyboard emojis)"
                    >
                      😊
                    </button>
                    {/* Send button - appears when there's text */}
                    {(messageInput.trim() || selectedImage) && (
                      <button
                        onClick={() => {
                          if (selectedImage) {
                            handleSendWithImage();
                          } else {
                            handleSendMessage();
                          }
                        }}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                        title="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Emoji Picker - Position above input with high z-index */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-[80]">
                    <EmojiPicker
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      onEmojiSelect={(emoji) => {
                        setMessageInput(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Arc Progression Notification */}
      <ArcProgressionNotification socket={socket} />
      
      {/* Report User Modal */}
      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUser={partner}
      />
    </>
  );
}
