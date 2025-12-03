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
import Dashboard from './Dashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChatPage({ user, openSettings }) {
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
  const [showDashboard, setShowDashboard] = useState(true);
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
  
  // Reset friend request sent flag when partner changes
  useEffect(() => {
    setFriendRequestSent(false);
  }, [partner]);

  const handleStartMatching = () => {
    console.log('Starting matching...', { 
      socket: !!socket, 
      socketConnected, 
      socket_id: socket?.id,
      user_id: user.id,
      user_name: user.name,
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
          handleStartMatching();
        }
      }, 2000);
      return;
    }

    console.log('Emitting join_matching event with data:', {
      user_id: user.id,
      user_name: user.name,
      filters: searchFilters
    });
    
    socket.emit('join_matching', {
      user_id: user.id,
      user_data: user,
      filters: searchFilters
    });
    
    toast.info('Searching for a match...');
    setMatching(true);
    setSkipCount(0); // Reset skip count when starting new search
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
      socket.emit('typing_start');
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        socket.emit('typing_stop');
        setTypingTimeout(null);
      }, 3000);
      
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
    
    // Start typing indicator if user is typing
    if (value.trim() && !typingTimeout) {
      handleTypingStart();
    }
    
    // If input becomes empty, stop typing indicator
    if (!value.trim() && typingTimeout) {
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
    if (!partner) return;
    
    try {
      // For anonymous users, include user data in the request
      let requestBody = {};
      
      if (user?.isAnonymous) {
        requestBody = { user_data: user };
        console.log('🔵 Sending anonymous friend request:', {
          partner_id: partner.id,
          user_id: user?.id,
          user_name: user?.name,
          isAnonymous: user?.isAnonymous,
          requestBody: JSON.stringify(requestBody)
        });
      } else {
        console.log('🟢 Sending authenticated friend request:', {
          partner_id: partner.id,
          user_id: user?.id
        });
      }
      
      const response = await axiosInstance.post(`/friend-requests/${partner.id}`, requestBody);
      console.log('✅ Friend request response:', response.data);
      setFriendRequestSent(true); // Mark as sent
      toast.success('👋 Friend request sent!');
    } catch (error) {
      console.error('❌ Friend request error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      // Check if already sent or already friends
      if (error.response?.data?.detail?.includes('already sent')) {
        setFriendRequestSent(true);
        toast.info('Friend request already sent');
      } else if (error.response?.data?.detail?.includes('Already friends')) {
        setFriendRequestSent(true);
        toast.info('Already friends with this user');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to send friend request');
      }
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
    return <Dashboard 
      user={user} 
      onStartChat={() => {
        setShowDashboard(false);
        handleStartMatching();
      }}
      onManageInterests={openSettings}
    />;
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
          matchingStats={matchingStats}
        />
      </>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] relative">
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
        <div className="flex-shrink-0 bg-[#212d3d]/80 backdrop-blur-sm border-b border-gray-800/50 px-3 sm:px-4 py-3 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={handleLeaveChat}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1.5 sm:p-2"
                data-testid="leave-chat-btn"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="text-white font-medium text-sm sm:text-base">
                # anime-chat
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button
                onClick={handleSendFriendRequest}
                disabled={friendRequestSent}
                variant="ghost"
                size="sm"
                className={`p-1.5 sm:p-2 ${
                  friendRequestSent 
                    ? 'text-green-400 cursor-default' 
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid="send-friend-request-btn"
                title={friendRequestSent ? 'Friend request sent!' : 'Send friend request'}
              >
                {friendRequestSent ? (
                  <><UserPlus className="h-4 w-4" /> ✓</>
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => setShowReportModal(true)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-400 p-1.5 sm:p-2"
                title="Report User"
              >
                <Flag className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSkipPartner}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
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
              <div className="bg-red-500/20 backdrop-blur-sm px-4 py-3 border-b border-red-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="text-white font-medium">You have skipped this chat.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        // Handle report functionality
                        console.log('Report button clicked');
                        // You can add report logic here
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 h-auto rounded"
                    >
                      Report
                    </Button>
                    <Button
                      onClick={handleBackToMatching}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs px-3 py-1 h-auto rounded"
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
            
            {/* Shared Anime Universe Section - Simplified */}
            {sharedUniverse && (sharedUniverse.shared_anime?.length > 0 || sharedUniverse.shared_genres?.length > 0 || sharedUniverse.shared_themes?.length > 0 || compatibility > 0) && (
              <div className="bg-[#1e2936]/60 backdrop-blur-sm px-4 py-3 border-b border-gray-700/50">
                {/* Header with Compatibility Score */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <h3 className="text-white font-semibold text-sm">Shared Anime Universe</h3>
                  </div>
                  {compatibility > 0 && (
                    <div className="bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/40">
                      <span className="text-cyan-300 font-semibold text-sm">{compatibility}% Match</span>
                    </div>
                  )}
                </div>

                {/* Shared Content - Horizontal Layout */}
                <div className="flex flex-wrap gap-6">
                  {/* You both watched */}
                  {sharedUniverse.shared_anime?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-orange-400">🔥</span>
                        <span className="text-orange-300 font-semibold text-xs">You both watched:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sharedUniverse.shared_anime.slice(0, 3).map((anime, idx) => (
                          <Badge key={idx} className="bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 text-xs px-3 py-1">
                            {anime}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common genres */}
                  {sharedUniverse.shared_genres?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-purple-400">⚔️</span>
                        <span className="text-purple-300 font-semibold text-xs">Common genres:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sharedUniverse.shared_genres.slice(0, 3).map((genre, idx) => (
                          <Badge key={idx} className="bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs px-3 py-1">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common themes */}
                  {sharedUniverse.shared_themes?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-pink-400">🎯</span>
                        <span className="text-pink-300 font-semibold text-xs">Common themes:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sharedUniverse.shared_themes.slice(0, 3).map((theme, idx) => (
                          <Badge key={idx} className="bg-pink-500/20 text-pink-200 border border-pink-500/30 text-xs px-3 py-1">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Partner Name */}
                <div className="mt-3 text-center">
                  <span className="text-gray-400 text-xs">You are now chatting with </span>
                  <span className="text-cyan-400 font-semibold text-xs">{partner?.name || 'your match'}</span>
                  <span className="text-gray-400 text-xs">. Say hi! 👋</span>
                </div>
                
                {/* Privacy Notice */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span className="text-green-400">🔒</span>
                  <span>This chat is ephemeral - messages vanish when you skip or leave</span>
                </div>
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
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 space-y-1">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400 max-w-lg px-4">
                    <p className="text-xl mb-4">👋 Start the conversation!</p>
                    {sharedUniverse?.conversation_starters?.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 mb-4">Try one of these conversation starters:</p>
                        {sharedUniverse.conversation_starters.map((prompt, idx) => (
                          <div key={idx} className="bg-[#1e2936]/60 p-4 rounded-lg border border-cyan-500/20 text-left hover:border-cyan-500/40 transition-colors">
                            <p className="text-sm text-cyan-300 italic">"{prompt}"</p>
                          </div>
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
                    <div key={index} className="flex items-start gap-3 px-2 hover:bg-[#212d3d]/40 rounded group" style={{ paddingTop: isSameUser ? '2px' : '8px', paddingBottom: '2px' }}>
                      {/* Avatar - only show for first message in group */}
                      {!isSameUser ? (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: displayUser.color }}
                        >
                          {displayUser.avatar}
                        </div>
                      ) : (
                        <div className="w-10 flex-shrink-0" /> // Spacer to maintain alignment
                      )}
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {/* Username and Timestamp - Only show for first message in group */}
                        {!isSameUser && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">
                              {displayUser.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {timestamp}
                            </span>
                          </div>
                        )}
                        
                        {/* Message Text */}
                        <div className="text-gray-200 text-sm leading-relaxed">
                          {msg.is_spoiler && (
                            <Badge className="bg-red-500/20 text-red-300 mb-2 text-xs">⚠️ Potential Spoiler</Badge>
                          )}
                          {msg.image && (
                            <img 
                              src={msg.image} 
                              alt="Shared image" 
                              className="rounded-lg max-w-xs mb-2 cursor-pointer hover:opacity-90 transition-opacity"
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
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              {/* Image Preview - Outside of input container */}
              {selectedImage && (
                <div className="mb-2 relative inline-block">
                  <img 
                    src={selectedImage.preview} 
                    alt="Preview" 
                    className="h-20 w-20 object-cover rounded-lg border-2 border-cyan-500/30"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <div className="relative">
                {/* SKIP button only - Mobile optimized */}
                <div className="absolute left-1 sm:left-2 top-1 sm:top-2 z-10">
                  <Button
                    onClick={handleSkipPartner}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 sm:px-3 py-1 h-auto rounded"
                    size="sm"
                  >
                    SKIP
                  </Button>
                </div>
                
                <div className="bg-[#212d3d]/80 backdrop-blur-sm rounded-lg flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 pl-16 sm:pl-20">
                  <div className="flex-1">
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
                      className="bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 focus:outline-none p-0 h-auto text-sm sm:text-base"
                      data-testid="message-input"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
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
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Upload image"
                    >
                      <Image className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors"
                    >
                      😊
                    </button>
                  </div>
                  
                  {/* Emoji Picker - Position relative to input */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2">
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
