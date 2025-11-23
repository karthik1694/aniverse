import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, Trophy, Star, Zap, Moon, Crown, X, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';

const ArcProgressionNotification = ({ socket }) => {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleArcProgression = (data) => {
      setNotification(data);
      setIsVisible(true);
      
      // Also show a toast notification
      toast.success(`🎉 Arc Progression: ${data.new_arc}`, {
        duration: 5000,
      });

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    };

    socket.on('arc_progression', handleArcProgression);

    return () => {
      socket.off('arc_progression', handleArcProgression);
    };
  }, [socket]);

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

  const getArcMessage = (phase) => {
    const messages = {
      prologue: "Your anime journey begins! Welcome to the world of connections.",
      connection: "Amazing! You've found your first anime soulmate. The bonds are forming!",
      rising_bond: "Incredible! Your conversations are deepening. True friendship is blooming!",
      adventure: "Outstanding! You're exploring new anime worlds with fellow fans!",
      power: "Legendary! You've mastered the art of anime connections!",
      eclipse: "Mythical! You've reached the pinnacle of anime social mastery!",
      redemption: "Epic return! Your comeback story is worthy of the greatest anime!"
    };
    return messages[phase] || "Your anime story continues to unfold!";
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCelebrate = () => {
    // Create enhanced anime-style confetti effect
    const confettiCount = 80;
    const shapes = ['⭐', '✨', '🎊', '🎉', '💫', '🌟', '⚡', '💥'];
    
    for (let i = 0; i < confettiCount; i++) {
      const confettiElement = document.createElement('div');
      confettiElement.className = 'fixed pointer-events-none z-50 text-2xl';
      confettiElement.style.left = Math.random() * 100 + 'vw';
      confettiElement.style.top = '-50px';
      confettiElement.style.fontSize = Math.random() * 20 + 15 + 'px';
      confettiElement.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      confettiElement.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiElement.style.animation = `animefall ${Math.random() * 4 + 3}s linear forwards`;
      confettiElement.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
      
      document.body.appendChild(confettiElement);
      
      setTimeout(() => {
        confettiElement.remove();
      }, 7000);
    }

    // Add screen flash effect
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 bg-white pointer-events-none z-40';
    flash.style.animation = 'flash 0.3s ease-out';
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.remove();
    }, 300);

    // Add CSS animations if not already present
    if (!document.getElementById('anime-celebration-styles')) {
      const style = document.createElement('style');
      style.id = 'anime-celebration-styles';
      style.textContent = `
        @keyframes animefall {
          0% {
            transform: translateY(-50px) rotate(0deg) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(0px) rotate(36deg) scale(1);
          }
          100% {
            transform: translateY(100vh) rotate(360deg) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Play celebration sound effect (if available)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (e) {
      // Audio not supported, continue without sound
    }
  };

  if (!notification || !isVisible) return null;

  const ArcIcon = getArcIcon(notification.phase);
  const arcColor = getArcColor(notification.phase);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-[#283347] border-white/5 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <PartyPopper className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Arc Progression!</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </Button>
          </div>

          <div className={`p-6 rounded-lg bg-gradient-to-r ${arcColor} text-white mb-4 relative overflow-hidden`}>
            {/* Enhanced background animation */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
              <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-white/20 animate-bounce"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/20 animate-bounce delay-500"></div>
              <div className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full bg-white/20 animate-bounce delay-1000"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-full animate-pulse">
                  <ArcIcon size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-xl">🎊 New Arc Unlocked! 🎊</h4>
                  <p className="text-white/90 text-sm font-medium">Your anime story evolves...</p>
                </div>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg mb-3 border border-white/20">
                <p className="text-white font-bold text-lg">{notification.new_arc}</p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="animate-bounce">⭐</span>
                <span className="text-white/90 font-medium">Character Development Complete</span>
                <span className="animate-bounce delay-300">⭐</span>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 rounded-lg border border-white/10">
              <p className="text-white text-sm font-medium leading-relaxed">
                {getArcMessage(notification.phase)}
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleCelebrate}
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white font-bold px-6 py-3 text-sm shadow-lg transform hover:scale-105 transition-all duration-200 animate-pulse"
              >
                <PartyPopper size={18} className="mr-2" />
                🎉 Epic Celebration! 🎉
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-6 py-3 font-semibold transition-all duration-200"
              >
                Continue Journey →
              </Button>
            </div>
          </div>

          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/20 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-cyan-400/20 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 -right-2 w-4 h-4 bg-pink-400/20 rounded-full animate-pulse delay-500"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArcProgressionNotification;