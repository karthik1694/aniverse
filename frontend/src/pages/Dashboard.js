import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MessageCircle, Instagram, Twitter } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';

export default function Dashboard({ user, onStartChat, onManageInterests }) {
  const navigate = useNavigate();
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('both');
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [isAddingInterest, setIsAddingInterest] = useState(false);

  useEffect(() => {
    // Load user interests from all three sources
    const allInterests = [
      ...(user?.favorite_anime || []),
      ...(user?.favorite_genres || []),
      ...(user?.favorite_themes || [])
    ];
    setInterests(allInterests);
  }, [user]);

  const handleStartChat = () => {
    // Use onStartChat prop if provided, otherwise navigate
    if (onStartChat) {
      onStartChat();
    } else {
      navigate('/chat');
    }
  };

  const handleManageInterests = () => {
    // If onManageInterests callback is provided, use it
    if (onManageInterests) {
      onManageInterests();
    } else {
      // Fallback to navigation
      navigate('/profile-setup');
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    
    const updatedInterests = [...interests, newInterest.trim()];
    setInterests(updatedInterests);
    setNewInterest('');
    setIsAddingInterest(false);
    
    // Update backend
    try {
      await axiosInstance.put('profile', {
        favorite_genres: updatedInterests
      });
    } catch (error) {
      console.error('Error updating interests:', error);
    }
  };

  const handleRemoveInterest = async (interestToRemove) => {
    const updatedInterests = interests.filter(i => i !== interestToRemove);
    setInterests(updatedInterests);
    
    // Update backend
    try {
      await axiosInstance.put('profile', {
        favorite_genres: updatedInterests
      });
    } catch (error) {
      console.error('Error updating interests:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddInterest();
    } else if (e.key === 'Escape') {
      setIsAddingInterest(false);
      setNewInterest('');
    }
  };

  return (
    <div className="fixed inset-0 md:relative md:h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex flex-col overflow-auto z-[60] md:z-auto">
      {/* Main Content - Compact for mobile, fills available space */}
      <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 py-2 sm:py-4">
        <div className="w-full max-w-md mx-auto">
          {/* Logo and Brand - Compact on mobile */}
          <div className="text-center mb-3 sm:mb-6 md:mb-8">
            {/* Logo Icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-2 sm:mb-4 shadow-xl shadow-cyan-500/30 overflow-hidden">
              <img src="/logo.png" alt="otakucafe.fun Logo" className="w-full h-full object-cover scale-150" />
            </div>
            
            {/* Brand Name */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
              otakucafe<span className="text-red-500 text-base sm:text-lg md:text-xl">.fun</span>
            </h1>
            
            {/* Social Icons - Compact */}
            <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3">
              <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                <Instagram className="h-4 w-4 text-gray-400" />
              </a>
              <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                <Twitter className="h-4 w-4 text-gray-400" />
              </a>
              <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Main Card - Compact for mobile */}
          <div className="bg-[#1a2332]/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-2xl border border-cyan-500/20">
            {/* Interests Section */}
            <div className="mb-2 sm:mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-xs sm:text-sm">Your Interests</span>
                  <span className="text-green-400 text-[10px] sm:text-xs font-medium">(ON)</span>
                </div>
                <button 
                  onClick={handleManageInterests}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] sm:text-xs font-medium transition-colors"
                >
                  Manage
                </button>
              </div>
              
              {/* Interests Display - Compact */}
              <div className="border border-dashed border-cyan-500/30 rounded-lg p-2 bg-[#0f1419]/50">
                <div className="flex flex-wrap gap-1.5">
                  {interests.length > 0 ? (
                    interests.map((interest, index) => (
                      <Badge
                        key={index}
                        className="bg-[#2a3441] text-white border-0 px-2.5 py-1 text-xs rounded-md"
                      >
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs">You have no interests. Click to add some.</span>
                  )}
                  
                  {/* Add Interest Input/Button */}
                  {isAddingInterest ? (
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={() => {
                        if (!newInterest.trim()) {
                          setIsAddingInterest(false);
                        }
                      }}
                      placeholder="Type interest..."
                      className="bg-[#0f1419] border border-cyan-500/50 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 min-w-[100px]"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setIsAddingInterest(true)}
                      className="bg-cyan-500/10 text-cyan-400 border border-dashed border-cyan-500/30 hover:bg-cyan-500/20 px-2.5 py-1 text-xs rounded-md transition-all"
                    >
                      + Add interest
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gender Filter Section - Compact */}
            <div className="mb-2 sm:mb-3">
              <h3 className="text-white font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2">Gender Filter:</h3>
              <div className="flex justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSelectedGenderFilter('male')}
                  className={`relative flex flex-col items-center justify-center w-20 h-14 sm:w-24 sm:h-16 rounded-lg border-2 transition-all ${
                    selectedGenderFilter === 'male'
                      ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                      : 'border-gray-600/50 bg-[#0f1419]/50 hover:border-gray-500'
                  }`}
                >
                  {selectedGenderFilter === 'male' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-[8px]">👑</span>
                    </div>
                  )}
                  <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedGenderFilter === 'male' ? 'text-cyan-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/>
                  </svg>
                  <span className={`text-[10px] sm:text-xs font-semibold mt-0.5 ${
                    selectedGenderFilter === 'male' ? 'text-cyan-300' : 'text-gray-400'
                  }`}>Male</span>
                </button>

                <button
                  onClick={() => setSelectedGenderFilter('both')}
                  className={`relative flex flex-col items-center justify-center w-20 h-14 sm:w-24 sm:h-16 rounded-lg border-2 transition-all ${
                    selectedGenderFilter === 'both'
                      ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                      : 'border-gray-600/50 bg-[#0f1419]/50 hover:border-gray-500'
                  }`}
                >
                  {selectedGenderFilter === 'both' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-[8px]">👑</span>
                    </div>
                  )}
                  <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedGenderFilter === 'both' ? 'text-purple-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                  </svg>
                  <span className={`text-[10px] sm:text-xs font-semibold mt-0.5 ${
                    selectedGenderFilter === 'both' ? 'text-purple-300' : 'text-gray-400'
                  }`}>Both</span>
                </button>

                <button
                  onClick={() => setSelectedGenderFilter('female')}
                  className={`relative flex flex-col items-center justify-center w-20 h-14 sm:w-24 sm:h-16 rounded-lg border-2 transition-all ${
                    selectedGenderFilter === 'female'
                      ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/20'
                      : 'border-gray-600/50 bg-[#0f1419]/50 hover:border-gray-500'
                  }`}
                >
                  {selectedGenderFilter === 'female' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-[8px]">👑</span>
                    </div>
                  )}
                  <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedGenderFilter === 'female' ? 'text-pink-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.5 9.5c0-3.59-2.91-6.5-6.5-6.5s-6.5 2.91-6.5 6.5c0 3.18 2.3 5.84 5.32 6.37v2.25h-2.57v2h2.57V22h2v-1.88h2.57v-2h-2.57v-2.25c3.02-.53 5.32-3.19 5.32-6.37zm-6.5 4.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/>
                  </svg>
                  <span className={`text-[10px] sm:text-xs font-semibold mt-0.5 ${
                    selectedGenderFilter === 'female' ? 'text-pink-300' : 'text-gray-400'
                  }`}>Female</span>
                </button>
              </div>
            </div>

            {/* Action Buttons - Like Chitchat.gg */}
            <div className="flex gap-2">
              {/* Video Button */}
              <Button
                onClick={handleStartChat}
                className="w-12 h-12 p-0 bg-[#2a3441] hover:bg-[#3a4451] text-white rounded-lg border border-gray-600/30 flex items-center justify-center"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Button>
              
              {/* Main Chat Button */}
              <Button
                onClick={handleStartChat}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 text-sm sm:text-base font-bold rounded-lg shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Start Text Chat
              </Button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-gray-400 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
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
