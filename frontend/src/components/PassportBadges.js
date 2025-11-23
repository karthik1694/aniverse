import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trophy, Target } from 'lucide-react';

const PassportBadges = ({ badges }) => {
  const mockBadges = [
    { id: 1, name: "First Steps", description: "Joined the anime community", emoji: "🌱", rarity: "common", earned: true, progress: 100 },
    { id: 2, name: "Matchmaker", description: "Made your first connection", emoji: "💕", rarity: "common", earned: false, progress: 0 },
    { id: 3, name: "Theory Crafter", description: "Shared deep anime insights", emoji: "🧠", rarity: "rare", earned: false, progress: 25 },
    { id: 4, name: "Night Owl", description: "Active during late hours", emoji: "🦉", rarity: "epic", earned: false, progress: 60 },
    { id: 5, name: "Legendary Weeb", description: "Achieved ultimate otaku status", emoji: "🏆", rarity: "legendary", earned: false, progress: 5 },
  ];

  const badgeData = badges.length > 0 ? badges : mockBadges;
  const earnedBadges = badgeData.filter(badge => badge.earned);
  const availableBadges = badgeData.filter(badge => !badge.earned);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-purple-500 to-pink-500';
      case 'epic': return 'from-orange-500 to-red-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'border-purple-500/50';
      case 'epic': return 'border-orange-500/50';
      case 'rare': return 'border-blue-500/50';
      default: return 'border-gray-500/50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Earned Badges */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-400" />
          Earned Badges ({earnedBadges.length})
        </h3>
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedBadges.map((badge) => (
              <Card key={badge.id} className={`bg-gray-800/50 ${getRarityBorder(badge.rarity)} backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">{badge.emoji}</div>
                    <h4 className="font-bold text-white mb-2">{badge.name}</h4>
                    <p className="text-sm text-gray-400 mb-3">{badge.description}</p>
                    <Badge className={`bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white font-semibold`}>
                      {badge.rarity.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h4 className="text-xl font-bold text-white mb-2">No Badges Yet</h4>
            <p className="text-gray-400">Start your anime journey to earn badges!</p>
          </div>
        )}
      </div>

      {/* Available Badges */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-gray-400" />
          Available Badges ({availableBadges.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableBadges.map((badge) => (
            <Card key={badge.id} className="bg-gray-800/30 border-gray-600/50 backdrop-blur-sm hover:border-gray-500/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3 grayscale opacity-60">{badge.emoji}</div>
                  <h4 className="font-bold text-gray-300 mb-2">{badge.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">{badge.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">{Math.round(badge.progress)}%</span>
                    </div>
                    <Progress value={badge.progress} className="h-2" />
                  </div>
                  <Badge variant="outline" className={`mt-3 border-gray-600 text-gray-400`}>
                    {badge.rarity.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PassportBadges;