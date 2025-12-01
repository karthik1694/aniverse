import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Search, X, ArrowLeft, Home } from 'lucide-react';

export default function ProfileSetup({ user, setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [animeList, setAnimeList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [profile, setProfile] = useState({
    name: user.name || '',
    favorite_anime: user.favorite_anime || [],
    favorite_genres: user.favorite_genres || [],
    favorite_themes: user.favorite_themes || [],
    favorite_characters: user.favorite_characters || []
  });
  const [customAnime, setCustomAnime] = useState('');

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
    } else if (profile.favorite_anime.includes(customAnime.trim())) {
      toast.error('This anime is already in your favorites!');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.put('profile', profile);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      navigate('/chat');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('username changes')) {
        toast.error('Maximum username changes (3) reached');
      } else {
        toast.error('Failed to update profile');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#1a2332] text-white flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-white/5">
        {/* Navigation Header */}
        <div className="flex items-center justify-between p-4">
          <div></div>
          <Button
            variant="ghost"
            onClick={() => navigate('/chat')}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Title Section */}
        <div className="text-center pb-4 px-4">
          <h1 className="text-2xl font-bold mb-1">Complete Your Profile</h1>
          <p className="text-sm text-gray-300">Tell us about your anime preferences to find your perfect match</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl h-full py-4">
          <form onSubmit={handleSubmit} className="bg-[#283347] border border-white/5 p-6 rounded-2xl h-full flex flex-col" data-testid="profile-setup-form">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Username
                  <span className="text-xs text-gray-400 ml-2">
                    ({3 - (user.username_changes || 0)} changes remaining)
                  </span>
                </label>
                <Input
                  data-testid="username-input"
                  placeholder="Enter your username..."
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="bg-[#1e2936] border-white/10 text-white text-sm"
                  disabled={(user.username_changes || 0) >= 3}
                />
                {(user.username_changes || 0) >= 3 && (
                  <p className="text-xs text-red-400 mt-1">Maximum username changes reached</p>
                )}
              </div>

              {/* Favorite Anime */}
              <div>
                <label className="block text-sm font-semibold mb-1">Favorite Anime (Select at least 3)</label>
                
                {/* Search existing anime */}
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    data-testid="anime-search-input"
                    type="text"
                    placeholder="Search anime database..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="bg-[#1e2936] border-white/10 text-white pl-8 h-8 text-sm"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[#1e2936] border border-white/10 rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map((anime) => (
                        <div
                          key={anime.id}
                          onClick={() => addAnime(anime)}
                          className="p-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                          data-testid={`anime-result-${anime.id}`}
                        >
                          <p className="font-semibold text-sm">{anime.title}</p>
                          <p className="text-xs text-gray-400">{anime.genres.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add custom anime */}
                <div className="flex gap-2 mb-2">
                  <Input
                    data-testid="custom-anime-input"
                    type="text"
                    placeholder="Add any anime (e.g., AOT, DBZ, Naruto)..."
                    value={customAnime}
                    onChange={(e) => setCustomAnime(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomAnime()}
                    className="bg-[#1e2936] border-white/10 text-white h-8 text-sm flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addCustomAnime}
                    disabled={!customAnime.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 h-8 text-sm"
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {profile.favorite_anime.map((anime, index) => (
                    <Badge
                      key={index}
                      className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-2 py-0.5 flex items-center gap-1 text-xs"
                      data-testid={`selected-anime-${index}`}
                    >
                      {anime}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-400"
                        onClick={() => removeAnime(anime)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-semibold mb-2">Favorite Genres</label>
                <div className="flex flex-wrap gap-1">
                  {genres.map((genre) => (
                    <Badge
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`cursor-pointer px-3 py-1 text-xs ${
                        profile.favorite_genres.includes(genre)
                          ? 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                      }`}
                      data-testid={`genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <label className="block text-sm font-semibold mb-2">Favorite Themes</label>
                <div className="flex flex-wrap gap-1">
                  {themes.map((theme) => (
                    <Badge
                      key={theme}
                      onClick={() => toggleTheme(theme)}
                      className={`cursor-pointer px-3 py-1 text-xs ${
                        profile.favorite_themes.includes(theme)
                          ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                      }`}
                      data-testid={`theme-${theme.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-white/5">
              <Button
                type="submit"
                disabled={loading || profile.favorite_anime.length < 3 || !profile.name.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-4 text-base font-semibold rounded-xl shadow-lg shadow-cyan-500/20"
                data-testid="submit-profile-btn"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
              {(!profile.name.trim() || profile.favorite_anime.length < 3) && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {!profile.name.trim() ? 'Username required' : 'Select at least 3 anime to continue'}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
