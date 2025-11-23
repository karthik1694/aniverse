import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Users, Wifi, WifiOff, Heart, Sparkles, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

const MatchingScreen = ({ 
  matching, 
  socketConnected, 
  onStartMatching, 
  onCancel, 
  onBack,
  matchingStats = { totalUsers: 0, activeMatchers: 0 }
}) => {
  const [searchPhase, setSearchPhase] = useState(0);
  const [animationStep, setAnimationStep] = useState(0);
  const [searchText, setSearchText] = useState('Initializing...');
  const [showSkipMessage, setShowSkipMessage] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Search phases and messages
  const searchPhases = [
    { text: 'Scanning anime databases...', icon: '🔍', duration: 2000 },
    { text: 'Analyzing your preferences...', icon: '🧠', duration: 1800 },
    { text: 'Finding compatible fans...', icon: '💫', duration: 2200 },
    { text: 'Matching personalities...', icon: '🎭', duration: 1600 },
    { text: 'Connecting hearts...', icon: '💝', duration: 2000 },
    { text: 'Almost there...', icon: '⚡', duration: 1400 }
  ];

  // Animation cycle for the loading rings
  useEffect(() => {
    if (!matching) return;
    
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 8);
    }, 200);
    
    return () => clearInterval(interval);
  }, [matching]);

  // Search phase progression
  useEffect(() => {
    if (!matching) {
      setSearchPhase(0);
      setSearchText('Ready to find your anime soulmate?');
      return;
    }

    const progressPhases = () => {
      const currentPhase = searchPhases[searchPhase];
      setSearchText(currentPhase.text);
      
      const timeout = setTimeout(() => {
        setSearchPhase(prev => (prev + 1) % searchPhases.length);
      }, currentPhase.duration);
      
      return timeout;
    };

    const timeout = progressPhases();
    return () => clearTimeout(timeout);
  }, [matching, searchPhase]);

  // Handle skip scenarios
  useEffect(() => {
    if (matching && searchPhase >= 3) {
      // Simulate occasional skip messages for engagement
      const skipChance = Math.random();
      if (skipChance < 0.15) { // 15% chance
        setShowSkipMessage(true);
        toast.info('Someone skipped, finding another match...');
        setTimeout(() => setShowSkipMessage(false), 3000);
      }
    }
  }, [searchPhase, matching]);

  // Connection retry logic
  useEffect(() => {
    if (!socketConnected && matching) {
      setConnectionAttempts(prev => prev + 1);
      if (connectionAttempts > 0) {
        toast.warning('Reconnecting to server...');
      }
    } else {
      setConnectionAttempts(0);
    }
  }, [socketConnected, matching]);

  const renderLoadingAnimation = () => {
    return (
      <div className="relative w-32 h-32 mx-auto mb-6">
        {/* Outer ring */}
        <div className={`absolute inset-0 rounded-full border-4 border-transparent ${
          animationStep % 4 === 0 ? 'border-t-cyan-400' : 
          animationStep % 4 === 1 ? 'border-r-cyan-400' : 
          animationStep % 4 === 2 ? 'border-b-cyan-400' : 'border-l-cyan-400'
        } animate-spin`} style={{ animationDuration: '2s' }}></div>
        
        {/* Middle ring */}
        <div className={`absolute inset-2 rounded-full border-4 border-transparent ${
          animationStep % 3 === 0 ? 'border-t-blue-400' : 
          animationStep % 3 === 1 ? 'border-r-blue-400' : 'border-b-blue-400'
        } animate-spin`} style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        
        {/* Inner ring */}
        <div className={`absolute inset-4 rounded-full border-4 border-transparent ${
          animationStep % 2 === 0 ? 'border-t-purple-400' : 'border-b-purple-400'
        } animate-spin`} style={{ animationDuration: '1s' }}></div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-pulse">
            {matching ? searchPhases[searchPhase]?.icon || '💫' : '🎌'}
          </div>
        </div>
        
        {/* Floating particles */}
        {matching && (
          <>
            <div className={`absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping ${
              animationStep % 4 === 0 ? 'top-0 left-1/2' :
              animationStep % 4 === 1 ? 'top-1/2 right-0' :
              animationStep % 4 === 2 ? 'bottom-0 left-1/2' : 'top-1/2 left-0'
            }`}></div>
            <div className={`absolute w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping delay-300 ${
              animationStep % 3 === 0 ? 'top-4 right-4' :
              animationStep % 3 === 1 ? 'bottom-4 right-4' : 'bottom-4 left-4'
            }`}></div>
          </>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (!matching) return null;
    
    return (
      <div className="flex justify-center gap-4 mb-6">
        <Badge className="bg-cyan-500/20 text-cyan-300 px-3 py-1">
          <Users className="h-3 w-3 mr-1" />
          {matchingStats.activeMatchers || Math.floor(Math.random() * 50) + 20} searching
        </Badge>
        <Badge className="bg-green-500/20 text-green-300 px-3 py-1">
          <Heart className="h-3 w-3 mr-1" />
          {Math.floor(Math.random() * 100) + 500} matches today
        </Badge>
      </div>
    );
  };

  const renderSkipMessage = () => {
    if (!showSkipMessage) return null;
    
    return (
      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-300">
          <Zap className="h-4 w-4" />
          <span className="text-sm">Someone skipped - finding you a better match!</span>
        </div>
      </div>
    );
  };

  const renderConnectionStatus = () => {
    return (
      <div className={`flex items-center justify-center gap-2 mb-6 text-sm ${
        socketConnected ? 'text-green-400' : 'text-yellow-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          socketConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
        }`}></div>
        {socketConnected ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connected to server</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>
              {connectionAttempts > 0 ? `Reconnecting... (${connectionAttempts})` : 'Connecting...'}
            </span>
          </>
        )}
      </div>
    );
  };

  const renderMatchingTips = () => {
    if (!matching) return null;
    
    const tips = [
      "💡 Tip: Be yourself and share your favorite anime!",
      "🌟 Fun fact: 73% of users find their anime buddy within 3 matches",
      "🎯 Pro tip: Mention your current watching list to break the ice",
      "✨ Did you know? We match based on 50+ anime preferences",
      "🚀 Hang tight! Great matches are worth the wait"
    ];
    
    const currentTip = tips[searchPhase % tips.length];
    
    return (
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-sm text-gray-300 text-center italic">
          {currentTip}
        </p>
      </div>
    );
  };

  return (
    <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-particle-float"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400/40 rounded-full animate-particle-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-particle-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-pink-400/20 rounded-full animate-particle-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-60 left-1/2 w-1 h-1 bg-blue-300/40 rounded-full animate-particle-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-10 w-1.5 h-1.5 bg-purple-300/30 rounded-full animate-particle-float" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-80 left-1/3 w-1 h-1 bg-cyan-300/35 rounded-full animate-particle-float" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-blue-400/25 rounded-full animate-particle-float" style={{animationDelay: '1.8s'}}></div>
        
        {/* Animated Flowing Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1"/>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.1"/>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          {/* Flowing Curve 1 - Main curve */}
          <path
            d="M-100,400 Q200,200 400,350 T800,300 Q1000,250 1300,400"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            strokeDasharray="10 5"
          />
          
          {/* Flowing Curve 2 - Bottom curve */}
          <path
            d="M-50,600 Q300,450 500,550 T900,500 Q1100,450 1350,600"
            stroke="url(#lineGradient2)"
            strokeWidth="1.5"
            fill="none"
            className="animate-pulse"
            style={{animationDelay: '1.5s'}}
            strokeDasharray="8 4"
          />
          
          {/* Flowing Curve 3 - Top curve */}
          <path
            d="M200,100 Q400,50 600,150 T1000,100 Q1200,80 1400,200"
            stroke="url(#lineGradient1)"
            strokeWidth="1"
            fill="none"
            className="animate-pulse"
            style={{animationDelay: '3s'}}
            strokeDasharray="6 3"
          />
          
          {/* Additional flowing curves for more depth */}
          <path
            d="M-200,300 Q100,150 300,250 T700,200 Q900,180 1200,300"
            stroke="url(#lineGradient2)"
            strokeWidth="1"
            fill="none"
            className="animate-pulse"
            style={{animationDelay: '4s'}}
            strokeDasharray="4 6"
          />
        </svg>
        
        {/* Gradient Overlays */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-blue-500/10 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/5 via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <Card className="bg-[#212d3d]/80 backdrop-blur-sm border-gray-800/50 p-8 text-center max-w-lg w-full relative z-10" data-testid="matching-screen">
        {renderLoadingAnimation()}
        
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          {matching ? 'Finding Your Senpai' : 'Ready to Connect?'}
        </h2>
        
        <p className="text-gray-300 mb-4 text-base leading-relaxed">
          {matching ? searchText : 'Join thousands of anime fans and find your perfect match'}
        </p>
        
        {renderSkipMessage()}
        {renderConnectionStatus()}
        {renderStats()}
        
        {!matching ? (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge className="bg-blue-500/20 text-blue-300">
                <Sparkles className="h-3 w-3 mr-1" />
                Smart Matching
              </Badge>
              <Badge className="bg-green-500/20 text-green-300">
                <Star className="h-3 w-3 mr-1" />
                Safe Community
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300">
                <Heart className="h-3 w-3 mr-1" />
                Anime Lovers
              </Badge>
            </div>
            
            <Button 
              onClick={onStartMatching}
              disabled={!socketConnected}
              size="lg"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="begin-matching-btn"
            >
              {socketConnected ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Matching
                </>
              ) : (
                'Connecting...'
              )}
            </Button>
            
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button 
                onClick={onCancel}
                variant="outline"
                className="px-8 py-2 border-red-500/50 hover:bg-red-500/10 text-red-300 hover:text-red-200"
                data-testid="cancel-matching-btn"
              >
                Cancel Search
              </Button>
            </div>
            
            {renderMatchingTips()}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MatchingScreen;