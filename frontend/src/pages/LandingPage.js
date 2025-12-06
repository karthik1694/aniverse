import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Video, MessageCircle, Users, Sparkles, Heart, Star, Trophy, Zap, Shield, Target, UserPlus, Filter, Instagram, Twitter, Music } from 'lucide-react';
import { createAnonymousSession } from '../utils/anonymousAuth';

export default function LandingPage() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = '/images/background.jpg';
    img.onload = () => setImageLoaded(true);
  }, []);

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/`;
    console.log('Redirecting to auth with URL:', redirectUrl);
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleStartChatting = () => {
    console.log('Starting anonymous chat...');
    // Create anonymous session
    const { user, sessionToken } = createAnonymousSession();
    console.log('✅ Anonymous user created:', user.name);
    
    // Reload the page to trigger auth check and redirect to chat
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-cyan-500/10 bg-[#0a0e1a]/95 backdrop-blur-md flex-shrink-0 relative z-20">
        <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {/* Custom Anime Cafe Logo */}
              <div className="relative group">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-60 group-hover:opacity-100"></div>
                
                {/* Logo container */}
                <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 p-2 rounded-xl shadow-lg shadow-cyan-500/40 group-hover:shadow-cyan-500/60 transition-all duration-300 group-hover:scale-105">
                  {/* Coffee cup with steam */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
                    {/* Cup */}
                    <path d="M6 10h12v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8z" fill="white" opacity="0.95"/>
                    <rect x="5" y="8" width="14" height="2" rx="1" fill="white"/>
                    {/* Handle */}
                    <path d="M18 12h1c1.1 0 2 .9 2 2s-.9 2-2 2h-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
                    {/* Steam - anime style */}
                    <path d="M9 7c0-1 .5-2 .5-2s.5 1 .5 2-.5 1-.5 1S9 8 9 7z" fill="#FFD700" opacity="0.8">
                      <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                    </path>
                    <path d="M12 6c0-1 .5-2.5 .5-2.5s.5 1.5.5 2.5-.5 1-.5 1S12 7 12 6z" fill="#FFD700" opacity="0.9">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite"/>
                    </path>
                    <path d="M15 7c0-1 .5-2 .5-2s.5 1 .5 2-.5 1-.5 1S15 8 15 7z" fill="#FFD700" opacity="0.7">
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite"/>
                    </path>
                    {/* Anime sparkle */}
                    <circle cx="8" cy="15" r="1" fill="#FFD700" opacity="0.6">
                      <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                </div>
              </div>
              
              {/* Brand Text */}
              <div className="flex items-baseline">
                <h1 className="text-base sm:text-xl font-black text-white tracking-tight">
                  otaku<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">cafe</span><span className="text-[0.7em] text-purple-400">.fun</span>
                </h1>
              </div>
            </div>
            <Button
              onClick={handleLogin}
              data-testid="landing-login-btn"
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden">
        {/* Background Image - Only for hero section */}
        <div 
          className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-500 ${imageLoaded ? 'opacity-85' : 'opacity-0'}`}
          style={{
            backgroundImage: 'url(/images/background.jpg)',
            backgroundPosition: 'center 60%',
            backgroundColor: '#1a2332' // Fallback color while loading
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/60 via-[#0a0e1a]/50 to-[#0a0e1a]/90" />

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4 sm:mb-6">
              <Star className="h-4 sm:h-5 w-4 sm:w-5 text-cyan-400" />
              <span className="text-xs sm:text-sm text-cyan-400 font-medium">Join 10,000+ anime fans worldwide</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
              <span style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6)' }}>Connect with{' '}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                Anime Fans
              </span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.7)' }}>
              Chat, share recommendations, and make friends with anime lovers around the world. Find your community and connect over your favorite shows!
            </p>
            
            <Button
              onClick={handleStartChatting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto max-w-sm mx-auto"
            >
              Start Chatting Free
            </Button>
            <p className="text-xs sm:text-sm text-gray-400 mt-3 px-4">
              Chat anonymously • No account required • <button onClick={handleLogin} className="text-cyan-400 hover:text-cyan-300 underline">Or sign in</button>
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section - Normal Background */}
      <div className="bg-gradient-to-b from-[#0a0e1a] to-[#16213e]">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
          
          {/* Interest-Based Matching Section */}
          <div className="max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-20">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
              <div className="px-2">
                <p className="text-purple-400 text-base sm:text-lg mb-3 sm:mb-4 italic">Strangers turned friends</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                  Chat with Random Strangers With Similar{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Interests
                  </span>
                </h3>
                <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed">
                  Talk to online strangers who love what you love. Chat about anime, hobbies and enjoy fun conversations - all from one place! Making new friends based on interests is made easy.
                </p>
              </div>
              
              <div className="relative px-2">
                <div className="bg-[#1a2332]/80 backdrop-blur-md border border-cyan-500/30 p-4 sm:p-6 md:p-8 rounded-2xl">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h4 className="text-lg sm:text-xl font-bold text-white">Interests</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#2a3441] rounded-lg text-white border border-cyan-500/20 text-sm sm:text-base">
                      One Piece
                    </div>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#2a3441] rounded-lg text-white border border-cyan-500/20 text-sm sm:text-base">
                      Naruto
                    </div>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#2a3441] rounded-lg text-white border border-cyan-500/20 text-sm sm:text-base">
                      Attack on Titan
                    </div>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#2a3441] rounded-lg text-white border border-cyan-500/20 text-sm sm:text-base">
                      Demon Slayer
                    </div>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#2a3441] rounded-lg text-white border border-cyan-500/20 text-sm sm:text-base">
                      My Hero Academia
                    </div>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#2a3441] rounded-lg text-white border border-cyan-500/20 text-sm sm:text-base">
                      Jujutsu Kaisen
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Main Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto mb-8 sm:mb-12 px-2">
            {/* Card 1 - Smart Matching */}
            <div className="bg-[#1a2332]/60 backdrop-blur-md border border-cyan-500/20 p-6 sm:p-8 rounded-2xl hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-cyan-500/10 p-4 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                  <Users className="h-10 w-10 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-2">Smart Matching</h3>
              <p className="text-gray-400 text-center text-xs sm:text-sm">
                Get matched with fans who share your anime interests and vibes
              </p>
            </div>

            {/* Card 2 - Live Chat */}
            <div className="bg-[#1a2332]/60 backdrop-blur-md border border-cyan-500/20 p-6 sm:p-8 rounded-2xl hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-cyan-500/10 p-4 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                  <MessageCircle className="h-10 w-10 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-2">Live Chat</h3>
              <p className="text-gray-400 text-center text-xs sm:text-sm">
                Chat in real-time with friends and make new connections
              </p>
            </div>

            {/* Card 3 - Video Calls */}
            <div className="bg-[#1a2332]/60 backdrop-blur-md border border-cyan-500/20 p-6 sm:p-8 rounded-2xl hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 group sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-cyan-500/10 p-4 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                  <Video className="h-10 w-10 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-2">Watch Together</h3>
              <p className="text-gray-400 text-center text-xs sm:text-sm">
                Stream and enjoy anime with friends in real-time
              </p>
            </div>
          </div>

          {/* Best Site Section */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16 md:mb-20 text-center px-2">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              The best site to Chat with Anime Fans.
            </h3>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed px-2">
              Many text and video chat apps offer various features for meeting random strangers or chatting without bots, but not all of them are modern, secure and feature rich with a diverse interesting people from around the globe.
            </p>
          </div>

          {/* 4 Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-20 px-2">
            {/* Text Chat */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-full">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Text Chat</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Chat with anime fans worldwide via instant messaging. Share your thoughts and make connections.
              </p>
            </div>

            {/* Friends & History */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-full">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Friends & History</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Had a fun chat but skipped by accident? Find them in your chat history and add them as a friend.
              </p>
            </div>

            {/* Search Filters */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-full">
                  <Filter className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Smart Matching</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Get matched with people who share your anime interests. Use filters to find your perfect chat partner.
              </p>
            </div>

            {/* Safety & Moderation */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Safe Community</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                Report inappropriate users and enjoy a clean, respectful chat environment.
              </p>
            </div>
          </div>

          {/* Anime Passport Feature - REMOVED */}

          {/* From Strangers to Friends Section */}
          <div className="max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-20 px-2">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
              <div className="px-2">
                <p className="text-purple-400 text-base sm:text-lg mb-3 sm:mb-4 italic">Make the most out of your chats</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                  From Strangers to{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">
                    Friends
                  </span>
                </h3>
                <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed">
                  Discover new people, make real and genuine connections, discuss your favorite anime or just have casual chats. Our platform is designed to help you experience the best of online chatting with fellow otakus.
                </p>
              </div>
              
              <div className="relative px-2">
                <div className="relative p-4 sm:p-6 md:p-8">
                  {/* Decorative illustration placeholder */}
                  <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 rounded-3xl border-2 border-blue-500/40 relative">
                    {/* Friends list preview */}
                    <div className="bg-[#1a2332]/80 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MessageCircle className="h-5 w-5 text-cyan-400" />
                        <span className="text-white font-semibold">DIRECT MESSAGES</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">W</div>
                          <span className="text-gray-300">Wisecrack</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">S</div>
                          <span className="text-gray-300">Snarky</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">S</div>
                          <span className="text-gray-300">SassMaster</span>
                        </div>
                      </div>
                    </div>
                    {/* Decorative emojis */}
                    <div className="absolute -top-4 -left-4 text-5xl">💬</div>
                    <div className="absolute -bottom-4 -right-4 text-5xl">✨</div>
                    <div className="absolute top-1/2 -right-6 text-4xl">🎌</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 md:mb-20 px-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Ready to Make Anime Friends?</h3>
            <p className="text-gray-300 text-base sm:text-lg mb-4 sm:mb-6">
              Join thousands of anime fans chatting right now. Share your passion and discover new shows together!
            </p>
            <Button
              onClick={handleStartChatting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto max-w-sm mx-auto"
            >
              Join Free Now
            </Button>
            <p className="text-xs sm:text-sm text-gray-400 mt-3">
              Start chatting instantly • No signup needed • <button onClick={handleLogin} className="text-cyan-400 hover:text-cyan-300 underline">Or claim account</button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a0e1a] border-t border-cyan-500/10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 p-2.5 rounded-xl shadow-lg shadow-cyan-500/30">
                  {/* Coffee cup icon - smaller version for footer */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 10h12v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8z" fill="white" opacity="0.95"/>
                    <rect x="5" y="8" width="14" height="2" rx="1" fill="white"/>
                    <path d="M18 12h1c1.1 0 2 .9 2 2s-.9 2-2 2h-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
                    <circle cx="8" cy="15" r="1" fill="#FFD700" opacity="0.8"/>
                  </svg>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">
                otaku<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">cafe</span><span className="text-[0.5em] text-purple-400">.fun</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms Of Service
              </a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/guidelines" className="text-gray-400 hover:text-white transition-colors">
                Community Guidelines
              </a>
              <a href="/refund" className="text-gray-400 hover:text-white transition-colors">
                Refund Policy
              </a>
              <a href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact Us
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex gap-2 sm:gap-3">
              <a 
                href="#" 
                className="bg-white/5 hover:bg-white/10 p-2.5 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
              </a>
              <a 
                href="#" 
                className="bg-white/5 hover:bg-white/10 p-2.5 rounded-lg transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
              </a>
              <a 
                href="#" 
                className="bg-white/5 hover:bg-white/10 p-2.5 rounded-lg transition-colors"
                aria-label="Discord"
              >
                <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
              </a>
              <a 
                href="#" 
                className="bg-white/5 hover:bg-white/10 p-2.5 rounded-lg transition-colors"
                aria-label="TikTok"
              >
                <Music className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-cyan-500/10">
            <p className="text-gray-500 text-sm">
              All rights reserved. otakucafe.fun © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
