import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Users, Clock, MessageSquare, Search, Plus } from 'lucide-react';

const EpisodeRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingRooms();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = rooms.filter(room =>
        room.anime_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms(rooms);
    }
  }, [searchQuery, rooms]);

  const fetchTrendingRooms = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/episode-rooms/trending`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        setFilteredRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = (roomId) => {
    navigate(`/episode-room/${roomId}`);
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-[#1a2332]">
        <div className="text-white text-xl">Loading episode rooms...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#1a2332]">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Live Episode Rooms</h1>
          <p className="text-sm sm:text-base text-gray-400">Join trending anime discussions happening right now!</p>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 bg-[#283347] border-white/10 text-white placeholder:text-gray-400 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredRooms.length === 0 && (
          <Card className="bg-[#283347] border-white/5">
            <CardContent className="py-8 sm:py-12 text-center">
              <MessageSquare className="mx-auto mb-3 sm:mb-4 text-cyan-400" size={40} />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No active rooms found</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4 px-4">
                {searchQuery 
                  ? 'Try searching for a different anime' 
                  : 'Be the first to create a room for the latest episode!'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {filteredRooms.map((room) => (
            <Card 
              key={room.id} 
              className="bg-white/10 border-white/20 hover:bg-white/15 transition-all cursor-pointer"
              onClick={() => joinRoom(room.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-white text-base sm:text-lg mb-1">
                      {room.anime_title}
                    </CardTitle>
                    <CardDescription className="text-purple-200 text-xs sm:text-sm">
                      Episode {room.episode_number}
                    </CardDescription>
                  </div>
                  {room.anime_info?.image_url && (
                    <img 
                      src={room.anime_info.image_url} 
                      alt={room.anime_title}
                      className="w-12 h-16 sm:w-14 sm:h-18 md:w-16 md:h-20 object-cover rounded ml-2 sm:ml-3"
                    />
                  )}
                </div>

                {/* Room Stats */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                  <Badge variant="secondary" className="bg-purple-500/30 text-purple-100 text-xs">
                    <Users size={12} className="mr-1" />
                    {room.active_users_count || 0} online
                  </Badge>
                  <Badge variant="secondary" className="bg-indigo-500/30 text-indigo-100 text-xs">
                    <MessageSquare size={12} className="mr-1" />
                    {room.total_messages || 0} messages
                  </Badge>
                  <Badge variant="secondary" className="bg-pink-500/30 text-pink-100 text-xs">
                    <Clock size={12} className="mr-1" />
                    {getTimeRemaining(room.expires_at)}
                  </Badge>
                </div>

                {/* Genre Tags */}
                {room.anime_info?.genres && (
                  <div className="flex flex-wrap gap-1 mt-2 sm:mt-3">
                    {room.anime_info.genres.slice(0, 3).map((genre) => (
                      <Badge 
                        key={genre} 
                        variant="outline" 
                        className="text-xs border-white/30 text-white"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-sm sm:text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    joinRoom(room.id);
                  }}
                >
                  Join Discussion
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 sm:mt-8 text-center">
          <Button
            variant="outline"
            onClick={fetchTrendingRooms}
            className="border-white/30 text-white hover:bg-white/10 text-sm sm:text-base"
          >
            Refresh Rooms
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EpisodeRooms;