import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Sparkles } from 'lucide-react';

export default function InterestsSelectionModal({ isOpen, onClose, onComplete }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);

  const genres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller'
  ];

  const themes = [
    'School', 'Military', 'Ninja', 'Pirates', 'Magic', 'Demons',
    'Time Travel', 'Video Games', 'Survival', 'Super Power',
    'Detective', 'Historical'
  ];

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const toggleTheme = (theme) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter(t => t !== theme));
    } else {
      setSelectedThemes([...selectedThemes, theme]);
    }
  };

  const handleContinue = () => {
    if (selectedGenres.length > 0 || selectedThemes.length > 0) {
      onComplete({
        favorite_genres: selectedGenres,
        favorite_themes: selectedThemes
      });
    }
  };

  const canContinue = selectedGenres.length > 0 || selectedThemes.length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal - slides up from bottom */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[115] transition-transform duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-t-2 border-cyan-500/30 rounded-t-2xl sm:rounded-t-3xl shadow-2xl shadow-cyan-500/20 max-w-2xl mx-auto">
          {/* Content */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Your Interests</h2>
                  <p className="text-[10px] sm:text-xs text-gray-400">Help us find your perfect match</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Selected count */}
            {canContinue && (
              <div className="mb-3 sm:mb-4 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-xs sm:text-sm text-cyan-300">
                  ✨ {selectedGenres.length + selectedThemes.length} interest{selectedGenres.length + selectedThemes.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {/* Genres Section */}
            <div className="mb-4 sm:mb-5">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">Favorite Genres</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm transition-all duration-200 ${
                      selectedGenres.includes(genre)
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/30 scale-105'
                        : 'bg-[#283347] text-gray-300 border-gray-600 hover:border-gray-500 hover:bg-[#324155]'
                    }`}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Themes Section */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-white font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">Favorite Themes</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {themes.map((theme) => (
                  <Badge
                    key={theme}
                    onClick={() => toggleTheme(theme)}
                    className={`cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm transition-all duration-200 ${
                      selectedThemes.includes(theme)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/30 scale-105'
                        : 'bg-[#283347] text-gray-300 border-gray-600 hover:border-gray-500 hover:bg-[#324155]'
                    }`}
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="sticky bottom-0 bg-gradient-to-t from-[#16213e] via-[#16213e] to-transparent pt-3 sm:pt-4 pb-1 sm:pb-2">
              <Button
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none text-sm sm:text-base"
              >
                {canContinue ? "Start Matching! 🚀" : "Select at least 1 interest"}
              </Button>
              {!canContinue && (
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2 text-center">
                  Select your interests to find users with similar tastes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
