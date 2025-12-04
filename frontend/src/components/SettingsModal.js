import { useState, useEffect } from 'react';
import { X, User, Settings as SettingsIcon, Shield, Sliders } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { axiosInstance } from '../api/axiosInstance';
import { toast } from 'sonner';
import { isAnonymousUser } from '../utils/anonymousAuth';
import UserAvatar from './UserAvatar';

export default function SettingsModal({ user, setUser, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [animeList, setAnimeList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customAnime, setCustomAnime] = useState('');
  
  const [profile, setProfile] = useState({
    name: user.name || '',
    favorite_anime: user.favorite_anime || [],
    favorite_genres: user.favorite_genres || [],
    favorite_themes: user.favorite_themes || [],
  });

  // Update profile state when user data changes
  useEffect(() => {
    setProfile({
      name: user.name || '',
      favorite_anime: user.favorite_anime || [],
      favorite_genres: user.favorite_genres || [],
      favorite_themes: user.favorite_themes || [],
    });
  }, [user]);

  const genres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller'
  ];

  const themes = [
    'School', 'Military', 'Ninja', 'Pirates', 'Magic', 'Demons',
    'Time Travel', 'Video Games', 'Survival', 'Super Power',
    'Detective', 'Historical', 'Gore', 'Childcare'
  ];

  useEffect(() => {
    loadAnime();
  }, []);

  const loadAnime = async () => {
    try {
      const response = await axiosInstance.get('anime');
      setAnimeList(response.data);
    } catch (error) {
      console.error('Error loading anime:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const results = animeList.filter(anime => 
        anime.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addAnime = (anime) => {
    const animeTitle = typeof anime === 'string' ? anime : anime.title;
    if (!profile.favorite_anime.includes(animeTitle)) {
      setProfile({
        ...profile,
        favorite_anime: [...profile.favorite_anime, animeTitle]
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const addCustomAnime = () => {
    if (customAnime.trim() && !profile.favorite_anime.includes(customAnime.trim())) {
      setProfile({
        ...profile,
        favorite_anime: [...profile.favorite_anime, customAnime.trim()]
      });
      setCustomAnime('');
      toast.success(`Added "${customAnime.trim()}" to your favorites!`);
    }
  };

  const removeAnime = (title) => {
    setProfile({
      ...profile,
      favorite_anime: profile.favorite_anime.filter(a => a !== title)
    });
  };

  const toggleGenre = (genre) => {
    if (profile.favorite_genres.includes(genre)) {
      setProfile({
        ...profile,
        favorite_genres: profile.favorite_genres.filter(g => g !== genre)
      });
    } else {
      setProfile({
        ...profile,
        favorite_genres: [...profile.favorite_genres, genre]
      });
    }
  };

  const toggleTheme = (theme) => {
    if (profile.favorite_themes.includes(theme)) {
      setProfile({
        ...profile,
        favorite_themes: profile.favorite_themes.filter(t => t !== theme)
      });
    } else {
      setProfile({
        ...profile,
        favorite_themes: [...profile.favorite_themes, theme]
      });
    }
  };

  const handleSaveUsername = async () => {
    if (!profile.name.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    setLoading(true);
    try {
      // For anonymous users, just update local state
      if (isAnonymousUser(user)) {
        const updatedUser = {
          ...user,
          name: profile.name,
        };
        
        // Update localStorage for anonymous users
        localStorage.setItem('anonymous_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditingUsername(false);
        toast.success('Username updated successfully!');
      } else {
        // For authenticated users, save to backend
        const response = await axiosInstance.put('profile', { 
          ...user,
          name: profile.name 
        });
        setUser(response.data);
        setEditingUsername(false);
        toast.success('Username updated successfully!');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('username changes')) {
        toast.error('Maximum username changes (3) reached');
      } else {
        toast.error('Failed to update username');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInterests = async () => {
    setLoading(true);
    try {
      // For anonymous users, just update local state without backend call
      if (isAnonymousUser(user)) {
        const updatedUser = {
          ...user,
          favorite_anime: profile.favorite_anime,
          favorite_genres: profile.favorite_genres,
          favorite_themes: profile.favorite_themes,
        };
        
        // Update localStorage for anonymous users
        localStorage.setItem('anonymous_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditingInterests(false);
        setSearchQuery('');
        setCustomAnime('');
        setSearchResults([]);
        toast.success('Interests updated successfully!');
      } else {
        // For authenticated users, save to backend
        const response = await axiosInstance.put('profile', {
          ...user,
          favorite_anime: profile.favorite_anime,
          favorite_genres: profile.favorite_genres,
          favorite_themes: profile.favorite_themes,
        });
        setUser(response.data);
        setEditingInterests(false);
        setSearchQuery('');
        setCustomAnime('');
        setSearchResults([]);
        toast.success('Interests updated successfully!');
      }
    } catch (error) {
      console.error('Error updating interests:', error);
      toast.error('Failed to update interests');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: SettingsIcon },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#2b3544] rounded-lg w-full max-w-3xl max-h-[95vh] sm:max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar - Horizontal on mobile, Vertical on desktop */}
          <div className="md:w-48 border-b md:border-b-0 md:border-r border-white/10 p-2 md:p-3 flex md:flex-col gap-1 md:gap-1 overflow-x-auto md:overflow-x-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Avatar Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">Avatar</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <UserAvatar user={user} size="lg" />
                    <div className="text-xs text-gray-400">
                      Avatars are generated automatically based on your username.
                    </div>
                  </div>
                </div>

                {/* Username Section */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        USERNAME
                      </label>
                      {editingUsername ? (
                        <div className="space-y-2">
                          <Input
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="bg-[#1e2936] border-gray-700 text-white text-base sm:text-lg"
                            placeholder="Enter username"
                            disabled={(user.username_changes || 0) >= 3}
                          />
                          {!isAnonymousUser(user) && (
                            <p className="text-sm text-gray-400">
                              You have {3 - (user.username_changes || 0)} name changes left for today.
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-base sm:text-lg text-white mb-2">{profile.name}</p>
                          {!isAnonymousUser(user) && (
                            <p className="text-sm text-gray-400">
                              You have {3 - (user.username_changes || 0)} name changes left for today.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {!isAnonymousUser(user) && (
                      <button 
                        onClick={() => {
                          if (editingUsername) {
                            handleSaveUsername();
                          } else {
                            setEditingUsername(true);
                          }
                        }}
                        disabled={loading || (editingUsername && !profile.name.trim()) || (user.username_changes || 0) >= 3}
                        className="text-sm text-white hover:text-gray-200 bg-[#3a4556] hover:bg-[#434f62] px-4 py-2 rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : editingUsername ? 'Save' : 'Edit'}
                      </button>
                    )}
                  </div>
                  
                  {editingUsername && (
                    <Button
                      onClick={() => {
                        setEditingUsername(false);
                        setProfile({ ...profile, name: user.name });
                      }}
                      variant="ghost"
                      className="text-gray-300 hover:text-white text-sm"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {/* Interests Section */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        INTERESTS (ON)
                      </label>
                      {!editingInterests && (
                        <p className="text-sm text-gray-400">
                          You have {(profile.favorite_anime?.length || 0) + (profile.favorite_genres?.length || 0) + (profile.favorite_themes?.length || 0)} interests
                        </p>
                      )}
                    </div>
                    {!editingInterests && (
                      <button 
                        onClick={() => setEditingInterests(true)}
                        className="text-sm text-white hover:text-gray-200 bg-[#3a4556] hover:bg-[#434f62] px-4 py-2 rounded transition-colors font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {editingInterests && (
                    <div className="space-y-4">
                      {/* Add Interest Input */}
                      <div className="relative">
                        <div className="flex items-center gap-2 bg-[#1e2936] border border-gray-700 rounded px-3 py-2 hover:border-gray-600 transition-colors">
                          <span className="text-cyan-400 text-lg">+</span>
                          <Input
                            type="text"
                            placeholder="Add anime interest"
                            value={searchQuery || customAnime}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSearchQuery(value);
                              setCustomAnime(value);
                              handleSearch(value);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && customAnime.trim()) {
                                addCustomAnime();
                              }
                            }}
                            className="bg-transparent border-0 text-white text-sm focus:ring-0 p-0 h-auto"
                          />
                        </div>
                        
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-[#1e2936] border border-gray-700 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                            {searchResults.map((anime) => (
                              <div
                                key={anime.id}
                                onClick={() => addAnime(anime)}
                                className="p-3 hover:bg-white/5 cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors"
                              >
                                <p className="font-medium text-sm text-white">{anime.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{anime.genres.join(', ')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Anime Interests */}
                      {profile.favorite_anime.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Anime</label>
                          <div className="space-y-2">
                            {profile.favorite_anime.map((anime, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-[#1e2936] border border-gray-700 rounded px-3 py-2.5 group hover:border-gray-600 transition-colors"
                              >
                                <span className="text-sm text-white">{anime}</span>
                                <button
                                  onClick={() => removeAnime(anime)}
                                  className="text-gray-500 hover:text-red-400 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Genres */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Genres</label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {genres.map((genre) => (
                            <Badge
                              key={genre}
                              onClick={() => toggleGenre(genre)}
                              className={`cursor-pointer px-3 py-1 text-xs transition-colors ${
                                profile.favorite_genres.includes(genre)
                                  ? 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Themes */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Themes</label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {themes.map((theme) => (
                            <Badge
                              key={theme}
                              onClick={() => toggleTheme(theme)}
                              className={`cursor-pointer px-3 py-1 text-xs transition-colors ${
                                profile.favorite_themes.includes(theme)
                                  ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                          onClick={handleSaveInterests}
                          disabled={loading}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm px-4 py-2 w-full sm:w-auto"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingInterests(false);
                            setSearchQuery('');
                            setCustomAnime('');
                            setSearchResults([]);
                            setProfile({
                              ...profile,
                              favorite_anime: user.favorite_anime || [],
                              favorite_genres: user.favorite_genres || [],
                              favorite_themes: user.favorite_themes || [],
                            });
                          }}
                          variant="ghost"
                          className="text-gray-300 hover:text-white text-sm px-4 py-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Account Settings</h3>
                  {isAnonymousUser(user) ? (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <p className="text-sm text-orange-300 mb-3">
                        You're using an anonymous account. Claim your account to save your data permanently.
                      </p>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        Claim Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <div className="bg-[#1e2936] rounded px-3 py-2 text-white text-sm">
                          {user.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                        <div className="bg-[#1e2936] rounded px-3 py-2 text-white text-sm">
                          {user.premium ? 'Premium' : 'Free'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Privacy Settings</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-[#1e2936] rounded">
                      <div>
                        <p className="text-sm font-medium text-white">Show Online Status</p>
                        <p className="text-xs text-gray-400">Let others see when you're online</p>
                      </div>
                      <button className="bg-[#5865f2] w-10 h-6 rounded-full relative">
                        <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-[#1e2936] rounded">
                      <div>
                        <p className="text-sm font-medium text-white">Allow Friend Requests</p>
                        <p className="text-xs text-gray-400">Anyone can send you friend requests</p>
                      </div>
                      <button className="bg-[#5865f2] w-10 h-6 rounded-full relative">
                        <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Preferences</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Gender Filter</label>
                      <div className="flex flex-wrap gap-2">
                        {['Male', 'Female', 'Both'].map((option) => (
                          <button
                            key={option}
                            className={`px-4 py-2 rounded text-sm ${
                              user.gender === option.toLowerCase() || (option === 'Both' && !user.gender)
                                ? 'bg-[#5865f2] text-white'
                                : 'bg-[#1e2936] text-gray-300 hover:bg-[#252d3a]'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
