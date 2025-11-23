import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { ArrowLeft, Send, MoreVertical, Trash2, UserMinus, User } from 'lucide-react';
import io from 'socket.io-client';

export default function DirectChat({ user }) {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Prevent users from trying to chat with themselves
    if (friendId === user.id) {
      toast.error('You cannot chat with yourself');
      navigate('/chat');
      return;
    }
    
    loadFriend();
    loadMessages();
    initializeSocket();
    markMessagesAsRead();
    checkFriendshipStatus();

    return () => {
      cleanup();
    };
  }, [friendId, user.id]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markMessagesAsRead = async () => {
    try {
      await axiosInstance.post(`/mark-messages-read/${friendId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      const response = await axiosInstance.get(`/check-friendship/${friendId}`);
      setIsFriend(response.data.is_friend);
      console.log('Friendship status:', response.data.is_friend ? 'Friend' : 'Non-friend');
    } catch (error) {
      console.error('Error checking friendship status:', error);
      // Default to non-friend behavior if check fails
      setIsFriend(false);
    }
  };

  // Cleanup function with conditional persistence based on friendship status
  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setNewMessage('');
    
    // Only clear messages and message IDs for non-friends
    // For friends, preserve chat history for persistence
    if (!isFriend) {
      console.log('Clearing chat data for non-friend');
      setMessages([]);
      messageIdsRef.current.clear();
    } else {
      console.log('Preserving chat data for friend');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFriend = async () => {
    try {
      const response = await axiosInstance.get('/friends');
      const friends = response.data;
      const friendData = friends.find(f => f.id === friendId);
      if (friendData) {
        setFriend(friendData);
      } else {
        toast.error('Friend not found');
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error loading friend:', error);
      toast.error('Failed to load friend data');
    }
  };

  const loadMessages = async () => {
    try {
      const response = await axiosInstance.get(`/chat/history/${friendId}`);
      let historyMessages = response.data;
      
      // Handle different response formats
      if (historyMessages && historyMessages.messages) {
        historyMessages = historyMessages.messages;
      }
      
      console.log('Loaded messages:', historyMessages);
      
      // Clear previous message IDs and add history message IDs
      messageIdsRef.current.clear();
      if (Array.isArray(historyMessages)) {
        historyMessages.forEach(msg => {
          if (msg.id) {
            messageIdsRef.current.add(msg.id);
          }
        });
        setMessages(historyMessages);
      } else {
        console.error('Messages is not an array:', historyMessages);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load chat history');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    // Prevent multiple socket connections
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const newSocket = io(BACKEND_URL, {
      path: '/api/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      forceNew: true // Force new connection to prevent reuse
    });

    newSocket.on('connect', () => {
      console.log('Connected to direct chat socket');
      // Join a room for direct messaging
      newSocket.emit('join_direct_chat', {
        user_id: user.id,
        friend_id: friendId
      });
    });

    newSocket.on('direct_message_received', (messageData) => {
      console.log('Received message via socket:', messageData);
      
      // Prevent duplicate messages by checking message ID
      if (messageData.id && messageIdsRef.current.has(messageData.id)) {
        console.log('Duplicate message detected, skipping:', messageData.id);
        return;
      }
      
      if (messageData.id) {
        messageIdsRef.current.add(messageData.id);
      }
      
      setMessages(prev => {
        console.log('Current messages:', prev);
        // Double-check for duplicates in the array
        const exists = prev.some(msg => msg.id === messageData.id);
        if (exists) {
          console.log('Message already exists in array, skipping');
          return prev;
        }
        const newMessages = [...prev, messageData];
        console.log('Updated messages:', newMessages);
        return newMessages;
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from direct chat socket');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      from_user_id: user.id,
      to_user_id: friendId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      // Send via socket for real-time delivery
      socket.emit('send_direct_message', messageData);
      
      // Clear the input immediately for better UX
      setNewMessage('');
      
      // Don't add to local messages - let Socket.IO handle it to avoid duplicates
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDeleteChatHistory = async () => {
    setShowDropdown(false);
    try {
      await axiosInstance.delete(`/chat/history/${friendId}`);
      setMessages([]);
      messageIdsRef.current.clear();
      toast.success('Chat history deleted');
      setShowDropdown(false);
    } catch (error) {
      console.error('Error deleting chat history:', error);
      toast.error('Failed to delete chat history');
    }
  };

  const handleUnfriend = async () => {
    setShowDropdown(false);
    try {
      await axiosInstance.delete(`/friends/${friendId}`);
      toast.success(`Unfriended ${friend.name}`);
      setShowDropdown(false);
      cleanup();
      navigate('/chat');
    } catch (error) {
      console.error('Error unfriending:', error);
      toast.error('Failed to unfriend user');
    }
  };

  const handleViewProfile = () => {
    setShowDropdown(false);
    // Navigate to friend's profile page - you may need to create this route
    navigate(`/profile/${friendId}`);
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center">
        <div className="text-white">Loading chat...</div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center">
        <div className="text-white">Friend not found</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex flex-col relative overflow-hidden">
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
      
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f1419]/95 backdrop-blur-md border-b border-cyan-500/30 p-4 flex items-center gap-3 relative z-10 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            cleanup();
            navigate('/chat');
          }}
          className="text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-10 w-10 ring-2 ring-cyan-500/40">
          <AvatarImage src={friend.picture} />
          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">{friend.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-white font-semibold">{friend.name}</h2>
          <p className="text-sm text-cyan-300/90">
            {friend.favorite_anime.length > 0
              ? `Likes: ${friend.favorite_anime.slice(0, 2).join(', ')}`
              : 'Anime fan'
            }
          </p>
        </div>
        <div className="relative z-50" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all duration-200"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a2e] border border-cyan-500/50 rounded-lg shadow-2xl z-[99999]" style={{ position: 'absolute', zIndex: 99999 }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleViewProfile();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors flex items-center gap-2 border-b border-gray-700/50"
              >
                <User className="h-4 w-4" />
                View Profile
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteChatHistory();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors flex items-center gap-2 border-b border-gray-700/50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Chat History
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUnfriend();
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-2"
              >
                <UserMinus className="h-4 w-4" />
                Unfriend
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-xl font-bold text-white mb-2">Start your conversation!</h3>
            <p className="text-gray-400">
              Say hello to {friend.name} and start chatting about your favorite anime!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isFromUser = message.from_user_id === user.id;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);

              return (
                <div key={index}>
                  {showDate && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  )}
                  <div className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isFromUser 
                        ? 'bg-cyan-500 text-white' 
                        : 'bg-gray-700 text-white'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        isFromUser ? 'text-cyan-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-gradient-to-r from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f1419]/95 backdrop-blur-md border-t border-cyan-500/30 p-4 relative z-10 shadow-lg">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${friend.name}...`}
            className="flex-1 bg-[#0f1419]/70 backdrop-blur-sm border-cyan-500/40 text-white placeholder-cyan-300/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}