import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Filter, X, MapPin, Users, Heart } from 'lucide-react';
import { axiosInstance } from '../App';

export default function SearchFilters({ onFiltersChange, isOpen, onClose }) {
  const [filters, setFilters] = useState({
    gender: 'any',
    ageRange: { min: 18, max: 99 },
    location: '',
    interests: [],
    minCompatibility: 0
  });

  const [availableGenres, setAvailableGenres] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load available anime genres
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const response = await axiosInstance.get('/anime/genres');
      setAvailableGenres(response.data || [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
        'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
        'Sports', 'Supernatural', 'Thriller'
      ]);
    } catch (error) {
      // Use default genres if API fails
      setAvailableGenres([
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
        'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
        'Sports', 'Supernatural', 'Thriller'
      ]);
    }
  };

  const handleGenderChange = (gender) => {
    const newFilters = { ...filters, gender };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleInterestToggle = (interest) => {
    const newInterests = filters.interests.includes(interest)
      ? filters.interests.filter(i => i !== interest)
      : [...filters.interests, interest];
    
    const newFilters = { ...filters, interests: newInterests };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAgeRangeChange = (type, value) => {
    const newFilters = {
      ...filters,
      ageRange: { ...filters.ageRange, [type]: parseInt(value) }
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleLocationChange = (location) => {
    const newFilters = { ...filters, location };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCompatibilityChange = (value) => {
    const newFilters = { ...filters, minCompatibility: parseInt(value) };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      gender: 'any',
      ageRange: { min: 18, max: 99 },
      location: '',
      interests: [],
      minCompatibility: 0
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-[#1a2332] border-cyan-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/20 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Search Filters</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Gender Preference */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-cyan-400" />
            <label className="text-sm font-semibold text-white">Gender Preference</label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['any', 'male', 'female'].map((gender) => (
              <button
                key={gender}
                onClick={() => handleGenderChange(gender)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 capitalize ${
                  filters.gender === gender
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-white mb-3 block">Age Range</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Min Age</label>
              <input
                type="number"
                min="18"
                max="99"
                value={filters.ageRange.min}
                onChange={(e) => handleAgeRangeChange('min', e.target.value)}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="text-gray-400 mt-5">-</div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Max Age</label>
              <input
                type="number"
                min="18"
                max="99"
                value={filters.ageRange.max}
                onChange={(e) => handleAgeRangeChange('max', e.target.value)}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <label className="text-sm font-semibold text-white">Location (Optional)</label>
          </div>
          <input
            type="text"
            placeholder="e.g., United States, Japan, Europe..."
            value={filters.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
        </div>

        {/* Anime Interests */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-cyan-400" />
            <label className="text-sm font-semibold text-white">Preferred Genres</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map((genre) => (
              <Badge
                key={genre}
                onClick={() => handleInterestToggle(genre)}
                className={`cursor-pointer transition-all duration-200 ${
                  filters.interests.includes(genre)
                    ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {genre}
              </Badge>
            ))}
          </div>
          {filters.interests.length > 0 && (
            <p className="text-xs text-cyan-400 mt-2">
              {filters.interests.length} genre{filters.interests.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-cyan-400 text-sm mb-4 hover:text-cyan-300 transition-colors"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Filters
        </button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <label className="text-sm font-semibold text-white mb-3 block">
              Minimum Compatibility Score
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minCompatibility}
                onChange={(e) => handleCompatibilityChange(e.target.value)}
                className="flex-1"
              />
              <span className="text-cyan-400 font-semibold w-12 text-right">
                {filters.minCompatibility}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Only match with users who have at least {filters.minCompatibility}% compatibility
            </p>
          </div>
        )}

        {/* Active Filters Summary */}
        {(filters.gender !== 'any' || filters.interests.length > 0 || filters.location || filters.minCompatibility > 0) && (
          <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <h3 className="text-sm font-semibold text-cyan-300 mb-2">Active Filters:</h3>
            <div className="flex flex-wrap gap-2">
              {filters.gender !== 'any' && (
                <Badge className="bg-cyan-500/20 text-cyan-300">
                  Gender: {filters.gender}
                </Badge>
              )}
              {filters.location && (
                <Badge className="bg-cyan-500/20 text-cyan-300">
                  Location: {filters.location}
                </Badge>
              )}
              {filters.interests.length > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-300">
                  {filters.interests.length} genre{filters.interests.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {filters.minCompatibility > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-300">
                  Min {filters.minCompatibility}% compatibility
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={resetFilters}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Reset Filters
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </Card>
    </div>
  );
}
