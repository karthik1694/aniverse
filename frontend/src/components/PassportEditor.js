import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { 
  Search, 
  Star, 
  Users, 
  Heart, 
  Brain, 
  Sparkles, 
  Zap, 
  Crown,
  X,
  Plus,
  Check
} from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';

const ANIME_VIBES = {
  "Sad / Emotional": { 
    icon: Heart, 
    color: "from-blue-500 to-indigo-600",
    emoji: "😢",
    description: "Drawn to tearjerkers and emotional storytelling"
  },
  "Dark / Psychological": { 
    icon: Brain, 
    color: "from-purple-600 to-gray-800",
    emoji: "🧠",
    description: "Fascinated by complex minds and dark themes"
  },
  "Wholesome": { 
    icon: Sparkles, 
    color: "from-pink-400 to-rose-500",
    emoji: "🌸",
    description: "Loves heartwarming and feel-good stories"
  },
  "High Energy": { 
    icon: Zap, 
    color: "from-orange-500 to-red-600",
    emoji: "⚡",
    description: "Thrives on action-packed adventures"
  },
  "Chaotic Gremlin": { 
    icon: Crown, 
    color: "from-green-500 to-lime-600",
    emoji: "😈",
    description: "Embraces the weird and unpredictable"
  },
  "Quiet Protagonist": { 
    icon: Star, 
    color: "from-teal-500 to-cyan-600",
    emoji: "🤫",
    description: "Appreciates subtle storytelling and introspection"
  }
};

const PassportEditor = ({ open, onClose, currentPassport, onSave }) => {
  const [animeList, setAnimeList] = useState([]);
  const [animeSearch, setAnimeSearch] = useState('');
  const [characterSearch, setCharacterSearch] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(currentPassport?.top_5_anime || []);
  const [selectedCharacters, setSelectedCharacters] = useState(currentPassport?.top_3_characters || []);
  const [selectedVibe, setSelectedVibe] = useState(currentPassport?.anime_vibe || 'Wholesome');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAnimeList();
    }
  }, [open]);

  const loadAnimeList = async () => {
    try {
      const response = await axiosInstance.get('/anime');
      setAnimeList(response.data);
    } catch (error) {
      console.error('Error loading anime list:', error);
      toast.error('Failed to load anime list');
      // Set mock data for demo
      setAnimeList([
        { id: '1', title: 'Attack on Titan', image_url: null },
        { id: '2', title: 'Death Note', image_url: null },
        { id: '3', title: 'My Hero Academia', image_url: null },
        { id: '4', title: 'Demon Slayer', image_url: null },
        { id: '5', title: 'One Piece', image_url: null }
      ]);
    }
  };

  const searchAnime = async (query) => {
    if (!query.trim()) {
      loadAnimeList();
      return;
    }
    
    try {
      const response = await axiosInstance.get(`/anime?q=${encodeURIComponent(query)}`);
      setAnimeList(response.data);
    } catch (error) {
      console.error('Error searching anime:', error);
      toast.error('Failed to search anime');
    }
  };

  const addAnime = (anime) => {
    if (selectedAnime.length >= 5) {
      toast.error('You can only select up to 5 anime');
      return;
    }
    
    if (selectedAnime.some(a => a.id === anime.id)) {
      toast.error('This anime is already selected');
      return;
    }

    const newAnime = {
      id: anime.id,
      title: anime.title,
      image_url: anime.image_url,
      rank: selectedAnime.length + 1
    };

    setSelectedAnime([...selectedAnime, newAnime]);
  };

  const removeAnime = (animeId) => {
    const filtered = selectedAnime.filter(a => a.id !== animeId);
    // Rerank remaining anime
    const reranked = filtered.map((anime, index) => ({
      ...anime,
      rank: index + 1
    }));
    setSelectedAnime(reranked);
  };

  const moveAnime = (animeId, direction) => {
    const currentIndex = selectedAnime.findIndex(a => a.id === animeId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= selectedAnime.length) return;

    const newOrder = [...selectedAnime];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    // Update ranks
    const reranked = newOrder.map((anime, index) => ({
      ...anime,
      rank: index + 1
    }));
    
    setSelectedAnime(reranked);
  };

  const addCharacter = () => {
    if (selectedCharacters.length >= 3) {
      toast.error('You can only select up to 3 characters');
      return;
    }

    if (!characterSearch.trim()) {
      toast.error('Please enter a character name');
      return;
    }

    // Parse character input - expect format "Character Name from Anime Name" or just "Character Name"
    const input = characterSearch.trim();
    let characterName = input;
    let animeName = 'Unknown';
    
    if (input.includes(' from ')) {
      const parts = input.split(' from ');
      characterName = parts[0].trim();
      animeName = parts[1].trim();
    }

    const newCharacter = {
      id: Date.now().toString(),
      name: characterName,
      anime: animeName,
      image_url: null,
      rank: selectedCharacters.length + 1
    };

    setSelectedCharacters([...selectedCharacters, newCharacter]);
    setCharacterSearch('');
    toast.success(`Added ${characterName} to your favorites!`);
  };

  const removeCharacter = (characterId) => {
    const filtered = selectedCharacters.filter(c => c.id !== characterId);
    // Rerank remaining characters
    const reranked = filtered.map((character, index) => ({
      ...character,
      rank: index + 1
    }));
    setSelectedCharacters(reranked);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const passportData = {
        top_5_anime: selectedAnime,
        top_3_characters: selectedCharacters,
        anime_vibe: selectedVibe
      };

      await axiosInstance.put('/passport', passportData);
      toast.success('Passport updated successfully!');
      onSave(passportData);
      onClose();
    } catch (error) {
      console.error('Error saving passport:', error);
      toast.error('Failed to save passport');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnime = animeList.filter(anime => 
    anime.title.toLowerCase().includes(animeSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#283347] border-white/5 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Your Anime Passport</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Anime Vibe Selection */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">Choose Your Anime Vibe</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(ANIME_VIBES).map(([vibe, info]) => {
                const Icon = info.icon;
                const isSelected = selectedVibe === vibe;
                return (
                  <Card 
                    key={vibe}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r ' + info.color + ' border-white/20' 
                        : 'bg-[#1a2332] border-white/5 hover:border-white/10'
                    }`}
                    onClick={() => setSelectedVibe(vibe)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white/5'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{info.emoji}</span>
                            <h3 className="font-semibold">{vibe}</h3>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Top 5 Anime Selection */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Top 5 Anime ({selectedAnime.length}/5)
            </Label>
            
            {/* Selected Anime */}
            {selectedAnime.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Your Selection:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {selectedAnime.map((anime) => (
                    <Card key={anime.id} className="bg-[#1a2332] border-white/5">
                      <CardContent className="p-3">
                        <div className="aspect-[3/4] bg-gray-700 rounded-lg mb-2 overflow-hidden relative">
                          {anime.image_url ? (
                            <img 
                              src={anime.image_url} 
                              alt={anime.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Star className="h-6 w-6" />
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeAnime(anime.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-center">
                          <Badge className="mb-1">#{anime.rank}</Badge>
                          <div className="text-xs text-white line-clamp-2">{anime.title}</div>
                          <div className="flex justify-center gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => moveAnime(anime.id, 'up')}
                              disabled={anime.rank === 1}
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => moveAnime(anime.id, 'down')}
                              disabled={anime.rank === selectedAnime.length}
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Anime Search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search anime to add..."
                  value={animeSearch}
                  onChange={(e) => {
                    setAnimeSearch(e.target.value);
                    searchAnime(e.target.value);
                  }}
                  className="pl-10 bg-[#1a2332] border-white/10"
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {filteredAnime.slice(0, 20).map((anime) => (
                  <Card 
                    key={anime.id} 
                    className="bg-[#1a2332] border-white/5 cursor-pointer hover:border-white/20 transition-colors"
                    onClick={() => addAnime(anime)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-[3/4] bg-gray-700 rounded-lg mb-2 overflow-hidden">
                        {anime.image_url ? (
                          <img 
                            src={anime.image_url} 
                            alt={anime.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Star className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-white text-center line-clamp-2">
                        {anime.title}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Top 3 Characters Selection */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Top 3 Characters ({selectedCharacters.length}/3)
            </Label>
            
            {/* Selected Characters */}
            {selectedCharacters.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Your Selection:</h4>
                <div className="space-y-2">
                  {selectedCharacters.map((character) => (
                    <Card key={character.id} className="bg-[#1a2332] border-white/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Badge>#{character.rank}</Badge>
                          <div className="flex-1">
                            <div className="font-medium text-white">{character.name}</div>
                            <div className="text-sm text-gray-400">{character.anime}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeCharacter(character.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Character Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter character name (e.g., 'Naruto from Naruto' or just 'Naruto')"
                  value={characterSearch}
                  onChange={(e) => setCharacterSearch(e.target.value)}
                  className="bg-[#1a2332] border-white/10"
                  onKeyPress={(e) => e.key === 'Enter' && addCharacter()}
                />
                <Button onClick={addCharacter} disabled={selectedCharacters.length >= 3}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Tip: Use format "Character Name from Anime Name" for best results
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {loading ? 'Saving...' : 'Save Passport'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PassportEditor;