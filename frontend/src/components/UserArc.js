import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Sparkles, Trophy, Star, Zap, Moon, Crown } from 'lucide-react';

const UserArc = ({ compact = false }) => {
  const [arcData, setArcData] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchArcData();
    fetchMilestones();
  }, []);

  const fetchArcData = async () => {
    try {
      const response = await fetch('/api/user/arc', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setArcData(data);
      }
    } catch (error) {
      console.error('Error fetching arc data:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/user/arc/milestones', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getArcIcon = (phase) => {
    const icons = {
      prologue: Sparkles,
      connection: Star,
      rising_bond: Zap,
      adventure: Trophy,
      power: Crown,
      eclipse: Moon,
      redemption: Star
    };
    return icons[phase] || Sparkles;
  };

  const getArcColor = (phase) => {
    const colors = {
      prologue: 'from-purple-500 to-pink-500',
      connection: 'from-blue-500 to-cyan-500',
      rising_bond: 'from-orange-500 to-red-500',
      adventure: 'from-green-500 to-emerald-500',
      power: 'from-yellow-500 to-orange-500',
      eclipse: 'from-indigo-500 to-purple-500',
      redemption: 'from-rose-500 to-pink-500'
    };
    return colors[phase] || 'from-purple-500 to-pink-500';
  };

  const getArcTitle = (phase) => {
    const titles = {
      prologue: "Prologue Arc",
      connection: "Connection Arc",
      rising_bond: "Rising Bond Arc",
      adventure: "Adventure Arc",
      power: "Power Arc",
      eclipse: "Eclipse Arc",
      redemption: "Redemption Arc"
    };
    return titles[phase] || "Unknown Arc";
  };

  const getPhaseDescription = (phase) => {
    const descriptions = {
      prologue: "Your anime journey begins...",
      connection: "First bonds are forming!",
      rising_bond: "Deepening connections through shared stories",
      adventure: "Exploring new worlds together",
      power: "Mastering the art of connection",
      eclipse: "A legendary anime socializer",
      redemption: "The triumphant return!"
    };
    return descriptions[phase] || "Your story continues...";
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (!arcData) return null;

  const ArcIcon = getArcIcon(arcData.current_phase);
  const arcColor = getArcColor(arcData.current_phase);

  if (compact) {
    return (
      <div 
        className={`p-3 rounded-lg bg-gradient-to-r ${arcColor} cursor-pointer transition-all hover:scale-105`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2 text-white">
          <ArcIcon size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {arcData.current_arc}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white/20 rounded-full h-1">
                <div 
                  className="bg-white h-1 rounded-full transition-all duration-500"
                  style={{ width: `${arcData.arc_progress || 0}%` }}
                />
              </div>
              <span className="text-xs opacity-80">
                {arcData.arc_progress || 0}%
              </span>
            </div>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="space-y-2">
              {milestones.slice(0, 3).map((milestone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-lg">{milestone.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/90 truncate">
                      {milestone.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-white/20 rounded-full h-1">
                        <div 
                          className="bg-white h-1 rounded-full"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                      {milestone.completed && (
                        <Badge className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-[#283347] border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${arcColor}`}>
            <ArcIcon size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">Your Arc</h3>
            <p className="text-sm text-gray-400">Character Development</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Arc */}
        <div className={`p-4 rounded-lg bg-gradient-to-r ${arcColor} text-white relative overflow-hidden`}>
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white animate-pulse"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-full">
                <ArcIcon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">{getArcTitle(arcData.current_phase)}</h4>
                <p className="text-white/80 text-sm">{getPhaseDescription(arcData.current_phase)}</p>
              </div>
            </div>
            
            <div className="bg-white/10 p-3 rounded-lg mb-3">
              <p className="text-white font-medium text-sm">{arcData.current_arc}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/20 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${arcData.arc_progress || 0}%` }}
                />
              </div>
              <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded">
                {arcData.arc_progress || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            Milestones
          </h4>
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-[#1a2332] rounded-lg">
                <span className="text-2xl">{milestone.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-white font-medium">{milestone.name}</h5>
                    {milestone.completed && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{milestone.description}</p>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={milestone.progress} 
                      className="flex-1 h-2"
                    />
                    <span className="text-xs text-gray-400">
                      {Math.round(milestone.progress)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        {arcData.stats && (
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Star size={16} className="text-cyan-400" />
              Your Stats
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1a2332] p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-cyan-400">
                  {arcData.stats.friends_count || 0}
                </p>
                <p className="text-xs text-gray-400">Friends</p>
              </div>
              <div className="bg-[#1a2332] p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-400">
                  {arcData.stats.messages_sent || 0}
                </p>
                <p className="text-xs text-gray-400">Messages</p>
              </div>
              <div className="bg-[#1a2332] p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {arcData.stats.episode_rooms_joined || 0}
                </p>
                <p className="text-xs text-gray-400">Rooms Joined</p>
              </div>
              <div className="bg-[#1a2332] p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {arcData.stats.episodes_watched || 0}
                </p>
                <p className="text-xs text-gray-400">Episodes</p>
              </div>
            </div>
          </div>
        )}

        {/* Arc History */}
        {arcData.arc_history && arcData.arc_history.length > 0 && (
          <div>
            <h4 className="text-white font-semibold mb-3">Arc History</h4>
            <div className="space-y-2">
              {arcData.arc_history.slice(-3).map((arc, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-[#1a2332] rounded">
                  <Trophy size={14} className="text-yellow-400" />
                  <span className="text-sm text-gray-300">{arc.arc}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(arc.achieved_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserArc;