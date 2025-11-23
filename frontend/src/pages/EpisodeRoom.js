import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Users, Send, ArrowLeft, Clock, AlertTriangle, Eye, EyeOff, Lock, Tag, X } from 'lucide-react';
import ArcProgressionNotification from '../components/ArcProgressionNotification';

const EpisodeRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [spoilerEpisodeNumber, setSpoilerEpisodeNumber] = useState('');
  const [showSpoilerTag, setShowSpoilerTag] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [canSeeSpoilers, setCanSeeSpoilers] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUserAndRoom();
    return () => {
      if (socket) {
        socket.emit('leave_episode_room');
        socket.disconnect();
      }
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserAndRoom = async () => {
    try {
      // Fetch current user
      const userResponse = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        credentials: 'include'
      });

      if (!userResponse.ok) {
        navigate('/');
        return;
      }

      const userData = await userResponse.json();
      setUser(userData);

      // Fetch room details
      const roomResponse = await fetch(`${process.env.REACT_APP_API_URL}/episode-rooms/${roomId}`, {
        credentials: 'include'
      });

      if (!roomResponse.ok) {
        setError('Room not found or has expired');
        setLoading(false);
        return;
      }

      const roomData = await roomResponse.json();
      setRoom(roomData);

      // Fetch room messages
      const messagesResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/episode-rooms/${roomId}/messages`,
        { credentials: 'include' }
      );

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }

      // Initialize Socket.IO
      initializeSocket(userData, roomData);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load room');
      setLoading(false);
    }
  };

  const initializeSocket = (userData, roomData) => {
    const newSocket = io(process.env.REACT_APP_API_URL, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to episode room socket');
      
      // Join the episode room
      newSocket.emit('join_episode_room', {
        room_id: roomId,
        user_id: userData.id
      });
    });

    newSocket.on('episode_room_joined', (data) => {
      setCanSeeSpoilers(data.can_see_spoilers);
      setActiveUsers(data.active_users);
    });

    newSocket.on('episode_room_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('episode_room_user_joined', (data) => {
      setActiveUsers(data.active_users);
    });

    newSocket.on('episode_room_user_left', (data) => {
      setActiveUsers(data.active_users);
    });

    newSocket.on('episode_room_expired', () => {
      setError('This room has expired');
      setTimeout(() => navigate('/episode-rooms'), 2000);
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message);
    });

    setSocket(newSocket);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket) return;

    const messageData = {
      message: messageInput
    };

    // Add spoiler episode number if specified
    if (spoilerEpisodeNumber && !isNaN(parseInt(spoilerEpisodeNumber))) {
      messageData.spoiler_episode_number = parseInt(spoilerEpisodeNumber);
    }

    socket.emit('send_episode_room_message', messageData);

    setMessageInput('');
    setSpoilerEpisodeNumber('');
    setShowSpoilerTag(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const markEpisodeWatched = async () => {
    if (!room) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/user/episode-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          anime_id: room.anime_id,
          episode_number: room.episode_number
        })
      });

      setCanSeeSpoilers(true);
      alert('Episode marked as watched! You can now see spoilers.');
    } catch (error) {
      console.error('Error marking episode:', error);
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-[#1a2332]">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-[#1a2332]">
        <Card className="bg-[#283347] border-white/5 max-w-md">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={() => navigate('/episode-rooms')}>
              Back to Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#1a2332]">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/episode-rooms')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Rooms
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-100">
              <Users size={14} className="mr-1" />
              {activeUsers} online
            </Badge>
            {room && (
              <Badge variant="secondary" className="bg-gray-500/20 text-gray-100">
                <Clock size={14} className="mr-1" />
                {getTimeRemaining(room.expires_at)}
              </Badge>
            )}
          </div>
        </div>

        {/* Room Info */}
        {room && (
          <Card className="bg-[#283347] border-white/5 mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl">
                    {room.anime_title} - Episode {room.episode_number}
                  </CardTitle>
                  {room.anime_info?.genres && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.anime_info.genres.map((genre) => (
                        <Badge key={genre} variant="outline" className="border-white/30 text-white text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {room.anime_info?.image_url && (
                  <img 
                    src={room.anime_info.image_url} 
                    alt={room.anime_title}
                    className="w-20 h-28 object-cover rounded"
                  />
                )}
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Spoiler Warning */}
        {!canSeeSpoilers && (
          <Alert className="mb-4 bg-yellow-500/20 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-100">
              <div className="flex items-center justify-between">
                <span>You haven't watched this episode yet. Spoilers will be blurred.</span>
                <Button
                  size="sm"
                  onClick={markEpisodeWatched}
                  className="ml-4 bg-yellow-600 hover:bg-yellow-700"
                >
                  Mark as Watched
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Chat Area */}
        <Card className="bg-[#283347] border-white/5 h-[calc(100vh-350px)]">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className="flex items-start gap-3">
                  {msg.user_picture && (
                    <img
                      src={msg.user_picture}
                      alt={msg.user_name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">
                        {msg.user_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.is_spoiler && !msg.is_locked && (
                        <Badge variant="destructive" className="text-xs">
                          Spoiler
                        </Badge>
                      )}
                      {msg.is_locked && (
                        <Badge className="text-xs bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                          <Lock size={10} className="mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    
                    {msg.is_locked ? (
                      // Locked message display
                      <div className="flex items-center gap-2 p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                        <Lock size={16} className="text-yellow-400 flex-shrink-0" />
                        <p className="text-yellow-200 text-sm italic">
                          {msg.message}
                        </p>
                      </div>
                    ) : (
                      // Regular message display
                      <p className={`text-white ${
                        msg.is_spoiler && !canSeeSpoilers
                          ? 'blur-sm select-none'
                          : ''
                      }`}>
                        {msg.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/20">
              {/* Spoiler Tag Input (when enabled) */}
              {showSpoilerTag && (
                <div className="mb-3 p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={16} className="text-yellow-400" />
                    <span className="text-yellow-200 text-sm font-medium">Tag Spoiler Episode</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowSpoilerTag(false);
                        setSpoilerEpisodeNumber('');
                      }}
                      className="ml-auto h-6 w-6 p-0 text-yellow-400 hover:text-yellow-300"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={spoilerEpisodeNumber}
                      onChange={(e) => setSpoilerEpisodeNumber(e.target.value)}
                      placeholder="Episode number..."
                      min="1"
                      className="bg-[#1a2332] border-yellow-600/30 text-white placeholder:text-yellow-400/60 w-32"
                    />
                    <span className="text-yellow-300 text-xs">
                      Messages will be locked for users who haven't reached this episode
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-[#1a2332] border-white/10 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={() => setShowSpoilerTag(!showSpoilerTag)}
                  variant="outline"
                  className="border-yellow-600/30 text-yellow-400 hover:bg-yellow-600/10 hover:text-yellow-300"
                  title="Tag spoiler episode"
                >
                  <Tag size={18} />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Send size={20} />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {canSeeSpoilers ? (
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    Spoilers visible
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <EyeOff size={12} />
                    Spoilers hidden
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Arc Progression Notification */}
      <ArcProgressionNotification socket={socket} />
    </div>
  );
};

export default EpisodeRoom;