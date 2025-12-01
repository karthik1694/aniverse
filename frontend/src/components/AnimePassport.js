import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Star, 
  Trophy, 
  Share2, 
  Edit, 
  Zap, 
  Heart, 
  Brain, 
  Sparkles, 
  Crown,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  Tv,
  Target,
  Plus,
  Copy,
  Download,
  Flame,
  Shield,
  Sword,
  Moon
} from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import PassportEditor from './PassportEditor';
import PassportBadges from './PassportBadges';
import UserAvatar from './UserAvatar';

const ANIME_VIBE_CONFIG = {
  "Sad / Emotional": { 
    icon: Heart, 
    gradient: "from-blue-400 via-purple-500 to-indigo-600",
    bgPattern: "bg-gradient-to-br from-blue-900/20 to-purple-900/20",
    emoji: "😢",
    description: "Drawn to tearjerkers and emotional storytelling",
    color: "text-blue-300"
  },
  "Dark / Psychological": { 
    icon: Brain, 
    gradient: "from-purple-600 via-gray-700 to-black",
    bgPattern: "bg-gradient-to-br from-purple-900/20 to-gray-900/20",
    emoji: "🧠",
    description: "Fascinated by complex minds and dark themes",
    color: "text-purple-300"
  },
  "Wholesome": {
    icon: Sparkles,
    gradient: "from-cyan-400 via-blue-500 to-teal-400",
    bgPattern: "bg-gradient-to-br from-cyan-900/20 to-blue-900/20",
    emoji: "🌸",
    description: "Loves heartwarming and feel-good stories",
    color: "text-cyan-300"
  },
  "High Energy": { 
    icon: Zap, 
    gradient: "from-orange-500 via-red-500 to-yellow-500",
    bgPattern: "bg-gradient-to-br from-orange-900/20 to-red-900/20",
    emoji: "⚡",
    description: "Thrives on action-packed adventures",
    color: "text-orange-300"
  },
  "Chaotic Gremlin": { 
    icon: Flame, 
    gradient: "from-green-500 via-lime-500 to-emerald-500",
    bgPattern: "bg-gradient-to-br from-green-900/20 to-lime-900/20",
    emoji: "😈",
    description: "Embraces the weird and unpredictable",
    color: "text-green-300"
  },
  "Quiet Protagonist": { 
    icon: Moon, 
    gradient: "from-teal-500 via-cyan-500 to-blue-500",
    bgPattern: "bg-gradient-to-br from-teal-900/20 to-cyan-900/20",
    emoji: "🤫",
    description: "Appreciates subtle storytelling and introspection",
    color: "text-teal-300"
  }
};

const LEVEL_THEMES = {
  1: { name: "Rookie Fan", icon: Star, color: "from-gray-500 to-gray-600", emoji: "🌱" },
  5: { name: "Otaku Initiate", icon: Sword, color: "from-blue-500 to-blue-600", emoji: "⚔️" },
  10: { name: "Anime Specialist", icon: Shield, color: "from-purple-500 to-purple-600", emoji: "🛡️" },
  20: { name: "Peak Enjoyer", icon: Crown, color: "from-yellow-500 to-orange-500", emoji: "👑" },
  50: { name: "Legendary Weeb", icon: Trophy, color: "from-pink-500 to-purple-600", emoji: "🏆" }
};

const AnimePassport = ({ user }) => {
  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareCard, setShareCard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPassportData();
  }, []);

  const loadPassportData = async () => {
    try {
      const response = await axiosInstance.get('passport');
      setPassportData(response.data);
    } catch (error) {
      console.error('Error loading passport:', error);
      toast.error('Failed to load passport data');
      // Create mock data for demo
      setPassportData({
        passport: {
          fate_number: Math.floor(Math.random() * 9999) + 1,
          passport_level: 1,
          passport_level_name: "Rookie Fan",
          anime_vibe: "Wholesome",
          top_5_anime: [],
          top_3_characters: [],
          total_experience: 0
        },
        stats: {
          total_matches: 0,
          total_friends: 0,
          messages_sent: 0,
          episode_rooms_visited: 0,
          days_active: 1,
          current_streak: 1
        },
        badges: [],
        journey: {
          joined_date: new Date().toISOString(),
          journey_events: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const generateShareCard = async () => {
    try {
      const response = await axiosInstance.post('passport/share');
      setShareCard(response.data);
      setShareDialogOpen(true);
    } catch (error) {
      console.error('Error generating share card:', error);
      // Create mock share card
      const mockShareCard = {
        user_name: user.name,
        user_picture: user.picture,
        fate_number: passportData.passport.fate_number,
        passport_level: passportData.passport.passport_level,
        passport_level_name: passportData.passport.passport_level_name,
        anime_vibe: passportData.passport.anime_vibe,
        badges_count: passportData.badges.length,
        top_anime: passportData.passport.top_5_anime.slice(0, 3),
        favorite_character: passportData.passport.top_3_characters[0] || null
      };
      setShareCard(mockShareCard);
      setShareDialogOpen(true);
    }
  };

  const copyShareCard = () => {
    if (!shareCard) return;
    
    const shareText = `🎴 My Anime Passport 🎴

👤 ${shareCard.user_name}
🔢 Fate Number: #${shareCard.fate_number}
⭐ Level: ${shareCard.passport_level_name}
🎭 Vibe: ${shareCard.anime_vibe}
🏆 Badges: ${shareCard.badges_count}

${shareCard.top_anime.length > 0 ? `Top Anime:\n${shareCard.top_anime.map((anime, i) => `${i + 1}. ${anime.title}`).join('\n')}` : ''}

${shareCard.favorite_character ? `Favorite Character: ${shareCard.favorite_character.name} from ${shareCard.favorite_character.anime}` : ''}

Join me on otakucafe.fun! 🌟`;

    navigator.clipboard.writeText(shareText);
    toast.success('Share card copied to clipboard!');
  };

  const handlePassportSave = (updatedPassport) => {
    setPassportData(prev => ({
      ...prev,
      passport: {
        ...prev.passport,
        ...updatedPassport
      }
    }));
    loadPassportData(); // Reload to get updated fate number
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gradient-to-r from-cyan-800/50 to-blue-800/50 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-800/50 rounded-xl"></div>
              <div className="h-32 bg-gray-800/50 rounded-xl"></div>
              <div className="h-32 bg-gray-800/50 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!passportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-6 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">😅</div>
            <h3 className="text-xl font-bold text-white mb-2">Passport Loading Failed</h3>
            <p className="text-gray-400 mb-4">Don't worry, your anime journey is just beginning!</p>
            <Button onClick={loadPassportData} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { passport, stats, badges, journey } = passportData;
  const vibeConfig = ANIME_VIBE_CONFIG[passport.anime_vibe] || ANIME_VIBE_CONFIG["Wholesome"];
  const levelTheme = LEVEL_THEMES[passport.passport_level] || LEVEL_THEMES[1];
  const VibeIcon = vibeConfig.icon;
  const LevelIcon = levelTheme.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Anime Passport
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your digital identity in the anime multiverse ✨
          </p>
        </div>

        {/* Main Passport Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-2xl"></div>
          </div>

          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-gradient-to-r from-cyan-500 to-blue-500">
                  <AvatarImage src={user.picture} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xl">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <p className="text-gray-400">Anime Enthusiast</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="border-purple-500/50 hover:bg-purple-500/20 text-purple-300 hover:text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Customize
                </Button>
                <Button
                  onClick={generateShareCard}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6">
            {/* Core Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fate Number */}
              <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-2">
                    #{passport.fate_number}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Fate Number</h3>
                  <p className="text-sm text-gray-400">Your unique anime signature</p>
                </CardContent>
              </Card>

              {/* Level */}
              <Card className={`bg-gradient-to-br ${levelTheme.color}/20 border-yellow-500/30 backdrop-blur-sm`}>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <LevelIcon className="h-8 w-8 text-yellow-400" />
                    <span className="text-4xl font-bold text-yellow-400">{passport.passport_level}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{passport.passport_level_name}</h3>
                  <p className="text-sm text-gray-400">Current Level</p>
                </CardContent>
              </Card>

              {/* Anime Vibe */}
              <Card className={`bg-gradient-to-br ${vibeConfig.bgPattern} border-gray-600/30 backdrop-blur-sm`}>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">{vibeConfig.emoji}</span>
                    <VibeIcon className={`h-8 w-8 ${vibeConfig.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{passport.anime_vibe}</h3>
                  <p className="text-sm text-gray-400">{vibeConfig.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Anime Section */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400" />
                Top 5 Anime
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {passport.top_5_anime.map((anime, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group">
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-3 overflow-hidden relative">
                        {anime.image_url ? (
                          <img 
                            src={anime.image_url} 
                            alt={anime.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Tv className="h-8 w-8" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold">
                            #{anime.rank}
                          </Badge>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-white text-center line-clamp-2">
                        {anime.title}
                      </h4>
                    </CardContent>
                  </Card>
                ))}
                {Array.from({ length: 5 - passport.top_5_anime.length }).map((_, index) => (
                  <Card 
                    key={`empty-${index}`} 
                    className="bg-gray-800/30 border-2 border-dashed border-gray-600 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                    onClick={() => setEditMode(true)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gray-800/50 rounded-lg mb-3 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300">
                        <Plus className="h-8 w-8 text-gray-500 group-hover:text-purple-400" />
                      </div>
                      <p className="text-xs text-gray-500 text-center">Add Anime</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Top Characters Section */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-cyan-400" />
                Top 3 Characters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {passport.top_3_characters.map((character, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full overflow-hidden">
                            {character.image_url ? (
                              <img 
                                src={character.image_url} 
                                alt={character.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white">
                                <Users className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs">
                            #{character.rank}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{character.name}</h4>
                          <p className="text-sm text-gray-400">{character.anime}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {Array.from({ length: 3 - passport.top_3_characters.length }).map((_, index) => (
                  <Card 
                    key={`empty-char-${index}`} 
                    className="bg-gray-800/30 border-2 border-dashed border-gray-600 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group"
                    onClick={() => setEditMode(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
                          <Plus className="h-8 w-8 text-gray-500 group-hover:text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Add Character</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="badges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger 
              value="journey"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Journey
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <PassportOverview stats={stats} passport={passport} />
          </TabsContent>

          <TabsContent value="badges" className="space-y-6 mt-6">
            <PassportBadges badges={badges} />
          </TabsContent>

          <TabsContent value="journey" className="space-y-6 mt-6">
            <PassportJourney journey={journey} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 mt-6">
            <PassportStats stats={stats} />
          </TabsContent>
        </Tabs>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Share2 className="h-5 w-5 text-purple-400" />
                Share Your Passport
              </DialogTitle>
            </DialogHeader>
            {shareCard && (
              <div className="space-y-4">
                <Card className={`bg-gradient-to-br ${vibeConfig.gradient} text-white overflow-hidden`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12 border-2 border-white/20">
                        <AvatarImage src={shareCard.user_picture} />
                        <AvatarFallback>{shareCard.user_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">{shareCard.user_name}</h3>
                        <p className="text-sm opacity-90">Fate #{shareCard.fate_number}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>Level: {shareCard.passport_level_name}</div>
                      <div>Badges: {shareCard.badges_count}</div>
                      <div className="col-span-2">Vibe: {shareCard.anime_vibe}</div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button onClick={copyShareCard} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text
                  </Button>
                  <Button variant="outline" className="border-gray-600 hover:bg-gray-800">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Passport Editor */}
        <PassportEditor
          open={editMode}
          onClose={() => setEditMode(false)}
          currentPassport={passport}
          onSave={handlePassportSave}
        />
      </div>
    </div>
  );
};

// Overview Component
const PassportOverview = ({ stats, passport }) => {
  const quickStats = [
    { label: 'Anime Watched', value: stats.total_matches || 0, icon: Tv, color: 'text-purple-400' },
    { label: 'Friends Made', value: stats.total_friends || 0, icon: Users, color: 'text-cyan-400' },
    { label: 'Messages Sent', value: stats.messages_sent || 0, icon: MessageCircle, color: 'text-green-400' },
    { label: 'Days Active', value: stats.days_active || 1, icon: Calendar, color: 'text-yellow-400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {quickStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Journey Component
const PassportJourney = ({ journey }) => {
  if (!journey) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-white mb-2">Your Journey Awaits</h3>
          <p className="text-gray-400">Start exploring to build your anime journey!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          Your Anime Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
          <div className="p-2 bg-cyan-500/20 rounded-full">
            <Sparkles className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Joined OtakuCafe</h4>
            <p className="text-sm text-gray-400">
              {new Date(journey.joined_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Stats Component
const PassportStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Matches',
      value: stats.total_matches || 0,
      icon: Heart,
      color: 'text-red-400',
      description: 'Anime connections made'
    },
    {
      title: 'Friends Made',
      value: stats.total_friends || 0,
      icon: Users,
      color: 'text-cyan-400',
      description: 'Fellow otaku met'
    },
    {
      title: 'Messages Sent',
      value: stats.messages_sent || 0,
      icon: MessageCircle,
      color: 'text-green-400',
      description: 'Conversations started'
    },
    {
      title: 'Episode Rooms',
      value: stats.episode_rooms_visited || 0,
      icon: Tv,
      color: 'text-purple-400',
      description: 'Discussion rooms visited'
    },
    {
      title: 'Current Streak',
      value: stats.current_streak || 1,
      icon: Flame,
      color: 'text-orange-400',
      description: 'Days active in a row'
    },
    {
      title: 'Days Active',
      value: stats.days_active || 1,
      icon: Calendar,
      color: 'text-yellow-400',
      description: 'Total days on platform'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`h-8 w-8 ${stat.color}`} />
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.title}</div>
                </div>
              </div>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AnimePassport;