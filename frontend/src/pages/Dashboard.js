import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { LogOut, User, Edit, Users, MessageCircle } from 'lucide-react';
import UserArc from '../components/UserArc';
import UserAvatar from '../components/UserAvatar';

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await axiosInstance.get('friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await axiosInstance.get('friend-requests');
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('auth/logout');
      setUser(null);
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axiosInstance.post(`/friend-requests/${requestId}/accept`);
      toast.success('Friend request accepted!');
      loadFriends();
      loadFriendRequests();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleStartMatching = () => {
    if (user.favorite_anime.length < 3) {
      toast.error('Please complete your profile first');
      navigate('/profile-setup');
      return;
    }
    navigate('/chat');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="h-full overflow-y-auto space-y-6">
              {/* Matching Section - Focus on core functionality like chitchat.gg */}
              <div className="flex justify-center">
                <Card className="bg-gradient-to-br from-[#2d4563] to-[#283347] border-white/5 p-8 text-center max-w-md w-full" data-testid="matching-card">
                  <div className="flex flex-col items-center justify-between h-full">
                    <div className="bg-cyan-400/10 p-4 rounded-full mb-4">
                      <MessageCircle className="h-10 w-10 text-cyan-400" />
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                      <h2 className="text-xl font-bold mb-3">Ready to Meet Fellow Fans?</h2>
                      <p className="text-gray-300 text-base mb-6 leading-relaxed">Start matching with anime fans who share your interests and make new friends!</p>
                    </div>
                    <Button
                      onClick={handleStartMatching}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg shadow-cyan-500/20 w-full"
                      data-testid="start-matching-btn"
                    >
                      Start Matching
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <Card className="bg-[#283347] border-white/5 p-5" data-testid="friend-requests-card">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-400" />
                    Friend Requests <span className="text-gray-400">({friendRequests.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {friendRequests.map(({ request, from_user }) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={from_user} size="md" className="border-2 border-white/10" />
                          <div>
                            <p className="font-semibold text-white text-sm">{from_user.name}</p>
                            <p className="text-sm text-gray-400">Wants to be friends</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAcceptRequest(request.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8 text-sm px-4"
                          data-testid={`accept-request-${request.id}`}
                        >
                          Accept
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

        </div>
      </div>
    </div>
  );
}
