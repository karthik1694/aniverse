import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Crown, Check, X, Sparkles, Zap, Star } from 'lucide-react';

export default function PremiumUpgrade({ user, setUser, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/premium/upgrade', null, {
        params: { plan_type: 'premium' }
      });
      
      toast.success('Successfully upgraded to Premium! 🎉');
      
      // Update user state
      const updatedUser = { ...user, premium: true };
      setUser(updatedUser);
      
      if (onClose) onClose();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('You already have an active premium subscription!');
      } else {
        toast.error('Failed to upgrade. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      name: "Unlimited Daily Matches",
      free: "10 matches/day",
      premium: "50 matches/day",
      icon: <Zap className="h-4 w-4" />
    },
    {
      name: "Create Episode Rooms",
      free: false,
      premium: true,
      icon: <Star className="h-4 w-4" />
    },
    {
      name: "Advanced Matching",
      free: false,
      premium: true,
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      name: "Extended Video Chat",
      free: "30 minutes",
      premium: "2 hours",
      icon: <Crown className="h-4 w-4" />
    },
    {
      name: "Priority Support",
      free: false,
      premium: true,
      icon: <Check className="h-4 w-4" />
    },
    {
      name: "Custom Profile Themes",
      free: false,
      premium: true,
      icon: <Sparkles className="h-4 w-4" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-[#283347] border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-yellow-500 to-amber-500 p-2 rounded-full">
                <Crown className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-white">Upgrade to Premium</h2>
            </div>
            <p className="text-gray-300 text-sm">
              Unlock exclusive features and support AniChat.gg
            </p>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">$9.99</div>
            <div className="text-sm text-gray-300">per month</div>
            <Badge className="mt-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              30-day free trial
            </Badge>
          </div>

          {/* Features Comparison */}
          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">What's Included</h3>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-cyan-400">
                    {feature.icon}
                  </div>
                  <span className="text-white font-medium text-sm">{feature.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Free */}
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-gray-400 mb-1">Free</div>
                    {feature.free === false ? (
                      <X className="h-4 w-4 text-red-400 mx-auto" />
                    ) : feature.free === true ? (
                      <Check className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <span className="text-xs text-gray-300">{feature.free}</span>
                    )}
                  </div>
                  {/* Premium */}
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-yellow-400 mb-1">Premium</div>
                    {feature.premium === false ? (
                      <X className="h-4 w-4 text-red-400 mx-auto" />
                    ) : feature.premium === true ? (
                      <Check className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <span className="text-xs text-yellow-300 font-medium">{feature.premium}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 hover:bg-white/5 text-white"
              disabled={loading}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold"
            >
              {loading ? 'Processing...' : 'Upgrade Now'}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-4">
            * This is a demo. No actual payment will be processed.
          </p>
        </div>
      </Card>
    </div>
  );
}