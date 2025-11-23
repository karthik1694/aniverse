import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Video, MessageCircle, Users, Sparkles, Heart, Star } from 'lucide-react';
import GenderSelectionModal from '../components/GenderSelectionModal';

export default function LandingPage() {
  const [showGenderModal, setShowGenderModal] = useState(false);

  useEffect(() => {
    // Show gender modal when user first visits the site
    const hasSeenGenderModal = localStorage.getItem('hasSeenGenderModal');
    if (!hasSeenGenderModal) {
      setShowGenderModal(true);
    }
  }, []);

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/`;
    console.log('Redirecting to auth with URL:', redirectUrl);
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGenderSelect = (gender) => {
    console.log('Selected gender:', gender);
    localStorage.setItem('hasSeenGenderModal', 'true');
    localStorage.setItem('selectedGender', gender);
    // After gender selection, proceed to login
    handleLogin();
  };

  const handleCloseGenderModal = () => {
    setShowGenderModal(false);
    localStorage.setItem('hasSeenGenderModal', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] text-white flex flex-col relative overflow-hidden">
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
      {/* Navigation */}
      <nav className="border-b border-gray-800/50 bg-[#1a2332]/95 backdrop-blur-sm flex-shrink-0 relative z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">AniChat.gg</h1>
            </div>
            <Button
              onClick={handleLogin}
              data-testid="landing-login-btn"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold border-0 text-base h-12 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-8">
              <Star className="h-5 w-5 text-cyan-400" />
              <span className="text-base text-cyan-400 font-medium">Join 10,000+ anime fans worldwide</span>
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Find Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              Anime Friends
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with anime lovers from around the world! Chat, share recommendations, discuss episodes, and build lasting friendships in our welcoming community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleLogin}
              data-testid="get-started-btn"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg border-0 h-14 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300"
            >
              Start Chatting Now
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 hover:bg-gray-800/50 text-white px-8 py-4 rounded-lg font-semibold text-lg h-14 hover:border-gray-600 hover:shadow-lg hover:shadow-gray-500/20 hover:scale-105 transition-all duration-300"
            >
              Explore Community
            </Button>
          </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
            <div
              className="bg-[#212d3d]/80 backdrop-blur-sm border border-gray-800/50 p-8 rounded-xl hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group hover:scale-105"
            data-testid="feature-matching"
          >
              <div className="bg-cyan-500/10 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors group-hover:shadow-lg group-hover:shadow-cyan-500/25">
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Smart Matching</h3>
              <p className="text-gray-400 text-base leading-relaxed">
              Connect with fans who share your anime interests! From action-packed shonen to heartwarming slice-of-life - find your tribe.
              </p>
            </div>

            <div
              className="bg-[#212d3d]/80 backdrop-blur-sm border border-gray-800/50 p-8 rounded-xl hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group hover:scale-105"
            data-testid="feature-video"
          >
              <div className="bg-blue-500/10 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors group-hover:shadow-lg group-hover:shadow-blue-500/25">
                <Video className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Live Conversations</h3>
              <p className="text-gray-400 text-base leading-relaxed">
              Chat face-to-face with anime enthusiasts worldwide. Share theories, discuss episodes, and geek out about your favorites!
              </p>
            </div>

            <div
              className="bg-[#212d3d]/80 backdrop-blur-sm border border-gray-800/50 p-8 rounded-xl hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group hover:scale-105"
            data-testid="feature-watchparty"
          >
              <div className="bg-purple-500/10 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors group-hover:shadow-lg group-hover:shadow-purple-500/25">
                <MessageCircle className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Watch Together</h3>
              <p className="text-gray-400 text-base leading-relaxed">
              Host or join watch parties with friends! Experience anime together in real-time with synchronized viewing and live reactions.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-gray-800/50 p-12 rounded-2xl max-w-4xl mx-auto backdrop-blur-sm shadow-2xl shadow-cyan-500/5">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-cyan-400 animate-pulse" />
                <span className="text-base text-cyan-400 font-medium">Your Anime Community Awaits</span>
            </div>
            
              <h3 className="text-4xl font-bold mb-4 text-white">Ready to Make Friends?</h3>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of anime fans from all walks of life. Share your passion, discover new series, and build meaningful friendships!
              </p>
              
              <Button
                onClick={handleLogin}
                data-testid="cta-join-btn"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-4 rounded-lg font-bold text-lg border-0 h-14 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300"
              >
                Join the Community
              </Button>
              
              <p className="text-sm text-gray-500 mt-6">Free to join • No credit card required</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 mt-12 py-6 bg-[#151d28]">
          <div className="container mx-auto px-6 text-center">
            <p className="text-gray-500 text-sm">&copy; 2025 AniChat.gg. Made with ❤️ for the anime community.</p>
          </div>
        </footer>
      </div>

      {/* Gender Selection Modal */}
      <GenderSelectionModal
        isOpen={showGenderModal}
        onClose={handleCloseGenderModal}
        onGenderSelect={handleGenderSelect}
      />
    </div>
  );
}
