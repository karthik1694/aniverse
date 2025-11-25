import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, UserMinus, UserPlus, Heart, Star, Calendar } from 'lucide-react';
import { io } from 'socket.io-client';

export default function ProfilePage({ user }) {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Helper function to check if a user is online based on real-time data
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  useEffect(() => {
    loadProfile();
    checkFriendshipStatus();
    setupSocketConnection();
  }, [friendId]);

  const setupSocketConnection = () => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const socket = io(BACKEND_URL, {
      path: '/api/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('ProfilePage connected to socket');
      socket.emit('get_online_users');
    });

    // Listen for online users updates
    socket.on('online_users_update', (onlineUsersList) => {
      setOnlineUsers(new Set(onlineUsersList));
    });

    // Listen for user online status changes
    socket.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.close();
    };
  };

  const loadProfile = async () => {
    try {
      // Try to get from friends list first
      const friendsResponse = await axiosInstance.get('/friends');
      const friends = friendsResponse.data;
      const friendProfile = friends.find(f => f.id === friendId);
      
      if (friendProfile) {
        setProfile(friendProfile);
        setIsFriend(true);
      } else {
        // If not a friend, we might need to create an endpoint to get user profiles
        // For now, show a message that profile is not available
        toast.error('Profile not available');
        navigate('/chat');
        return;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
      navigate('/chat');
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      const response = await axiosInstance.get(`/check-friendship/${friendId}`);
      setIsFriend(response.data.is_friend);
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  const handleSendMessage = () => {
    navigate(`/direct-chat/${friendId}`);
  };

  const handleUnfriend = async () => {
    try {
      await axiosInstance.delete(`/friends/${friendId}`);
      toast.success(`Unfriended ${profile.name}`);
      setIsFriend(false);
      navigate('/chat');
    } catch (error) {
      console.error('Error unfriending:', error);
      toast.error('Failed to unfriend user');
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await axiosInstance.post(`/friend-requests/${friendId}`);
      toast.success('Friend request sent!');
      setFriendRequestSent(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send friend request');
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center">
        <div className="text-white">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] overflow-y-auto">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-particle-float"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400/40 rounded-full animate-particle-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-particle-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-pink-400/20 rounded-full animate-particle-float" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f1419]/95 backdrop-blur-md border-b border-cyan-500/30 p-4 flex items-center gap-3 relative z-10 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="p-6 relative z-10">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="bg-gradient-to-br from-[#1a1a2e]/80 via-[#16213e]/80 to-[#0f1419]/80 backdrop-blur-sm border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-cyan-500/40">
                    <AvatarImage src={profile.picture} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-2xl">
                      {profile.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator - consistent based on user ID */}
                  {isUserOnline(profile.id) ? (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-[#0f1419] rounded-full"></div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-500 border-4 border-[#0f1419] rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{profile.name}</h2>
                  <p className="text-cyan-300 mb-4">Anime enthusiast</p>
                  <div className="flex gap-3">
                    {isFriend ? (
                      <>
                        <Button
                          onClick={handleSendMessage}
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          onClick={handleUnfriend}
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfriend
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleSendFriendRequest}
                        disabled={friendRequestSent}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {friendRequestSent ? 'Request Sent' : 'Add Friend'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Anime */}
          <Card className="bg-gradient-to-br from-[#1a1a2e]/80 via-[#16213e]/80 to-[#0f1419]/80 backdrop-blur-sm border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" />
                Favorite Anime
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.favorite_anime && profile.favorite_anime.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_anime.map((anime, index) => (
                    <Badge
                      key={index}
                      className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
                    >
                      {anime}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No favorite anime listed</p>
              )}
            </CardContent>
          </Card>

          {/* Favorite Genres */}
          <Card className="bg-gradient-to-br from-[#1a1a2e]/80 via-[#16213e]/80 to-[#0f1419]/80 backdrop-blur-sm border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Favorite Genres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.favorite_genres && profile.favorite_genres.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_genres.map((genre, index) => (
                    <Badge
                      key={index}
                      className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No favorite genres listed</p>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="bg-gradient-to-br from-[#1a1a2e]/80 via-[#16213e]/80 to-[#0f1419]/80 backdrop-blur-sm border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-400" />
                Profile Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Age:</span>
                    <span className="text-white">{profile.age}</span>
                  </div>
                )}
                {profile.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gender:</span>
                    <span className="text-white">{profile.gender}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">{profile.location}</span>
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <span className="text-gray-400">Bio:</span>
                    <p className="text-white mt-1">{profile.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}