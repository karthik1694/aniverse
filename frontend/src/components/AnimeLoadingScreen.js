import React from 'react';
import { Sparkles, Heart, Star, Zap } from 'lucide-react';

const AnimeLoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Enhanced Floating Particles */}
        <div className="absolute top-20 left-10 w-3 h-3 bg-cyan-400/40 rounded-full animate-particle-float"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-purple-400/50 rounded-full animate-particle-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-60 left-1/4 w-2.5 h-2.5 bg-pink-400/40 rounded-full animate-particle-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-3 h-3 bg-blue-400/30 rounded-full animate-particle-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-60 left-1/2 w-2 h-2 bg-cyan-300/50 rounded-full animate-particle-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-10 w-2.5 h-2.5 bg-purple-300/40 rounded-full animate-particle-float" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-80 left-1/3 w-2 h-2 bg-pink-300/45 rounded-full animate-particle-float" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-20 left-20 w-2.5 h-2.5 bg-blue-400/35 rounded-full animate-particle-float" style={{animationDelay: '1.8s'}}></div>
        
        {/* Additional Sparkle Particles */}
        <div className="absolute top-32 right-1/4 w-1 h-1 bg-yellow-400/60 rounded-full animate-twinkle" style={{animationDelay: '0.3s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-yellow-300/50 rounded-full animate-twinkle" style={{animationDelay: '1.7s'}}></div>
        <div className="absolute top-1/2 left-16 w-1 h-1 bg-white/70 rounded-full animate-twinkle" style={{animationDelay: '2.2s'}}></div>
        <div className="absolute top-1/4 right-16 w-1 h-1 bg-cyan-200/60 rounded-full animate-twinkle" style={{animationDelay: '3.1s'}}></div>
        
        {/* Animated Flowing Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="loadingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3"/>
            </linearGradient>
            <linearGradient id="loadingGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2"/>
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2"/>
            </linearGradient>
            <linearGradient id="loadingGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/>
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25"/>
            </linearGradient>
          </defs>
          
          {/* Main flowing curves with enhanced animation */}
          <path
            d="M-100,400 Q200,200 400,350 T800,300 Q1000,250 1300,400"
            stroke="url(#loadingGradient1)"
            strokeWidth="3"
            fill="none"
            className="animate-flow-line"
            strokeDasharray="20 10"
          />
          
          <path
            d="M-50,600 Q300,450 500,550 T900,500 Q1100,450 1350,600"
            stroke="url(#loadingGradient2)"
            strokeWidth="2.5"
            fill="none"
            className="animate-flow-line"
            style={{animationDelay: '1s'}}
            strokeDasharray="15 8"
          />
          
          <path
            d="M200,100 Q400,50 600,150 T1000,100 Q1200,80 1400,200"
            stroke="url(#loadingGradient3)"
            strokeWidth="2"
            fill="none"
            className="animate-flow-line"
            style={{animationDelay: '2s'}}
            strokeDasharray="12 6"
          />
          
          {/* Additional decorative curves */}
          <path
            d="M-200,300 Q100,150 300,250 T700,200 Q900,180 1200,300"
            stroke="url(#loadingGradient1)"
            strokeWidth="1.5"
            fill="none"
            className="animate-flow-line"
            style={{animationDelay: '3s'}}
            strokeDasharray="8 12"
          />
        </svg>
        
        {/* Enhanced Gradient Overlays */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-cyan-500/15 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-purple-500/15 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-pink-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 text-center">
        {/* Logo/Brand */}
        <div className="mb-8 animate-float">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl shadow-2xl shadow-cyan-500/30 mx-auto w-20 h-20 flex items-center justify-center mb-6">
            <Sparkles className="h-10 w-10 text-white animate-spin-slow" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            otakucafe<span className="text-2xl md:text-3xl text-gray-400">.fun</span>
          </h1>
          <p className="text-cyan-400 text-lg font-medium animate-pulse">
            Connecting anime souls worldwide
          </p>
        </div>

        {/* Animated Loading Indicators */}
        <div className="mb-8">
          {/* Main Loading Spinner */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
            
            {/* Middle Ring */}
            <div className="absolute inset-2 rounded-full border-3 border-purple-500/20"></div>
            <div className="absolute inset-2 rounded-full border-3 border-transparent border-r-purple-500 animate-spin-reverse"></div>
            
            {/* Inner Ring */}
            <div className="absolute inset-4 rounded-full border-2 border-pink-500/20"></div>
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-pink-500 animate-spin"></div>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="h-6 w-6 text-pink-400 animate-pulse" />
            </div>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          </div>

          {/* Loading Text with Typewriter Effect */}
          <div className="text-xl text-gray-300 font-medium">
            <span className="animate-typewriter">Preparing your anime adventure</span>
            <span className="animate-blink">|</span>
          </div>
        </div>

        {/* Floating Icons */}
        <div className="relative">
          <div className="absolute -top-16 -left-16 animate-float-delayed">
            <Star className="h-6 w-6 text-yellow-400 animate-twinkle" />
          </div>
          <div className="absolute -top-12 -right-12 animate-float-delayed" style={{animationDelay: '1s'}}>
            <Zap className="h-5 w-5 text-cyan-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-8 -left-8 animate-float-delayed" style={{animationDelay: '2s'}}>
            <Heart className="h-4 w-4 text-pink-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-6 -right-10 animate-float-delayed" style={{animationDelay: '0.5s'}}>
            <Sparkles className="h-5 w-5 text-purple-400 animate-twinkle" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 max-w-xs mx-auto">
          <div className="bg-gray-800/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full rounded-full animate-progress-fill"></div>
          </div>
          <p className="text-sm text-gray-400 mt-2 animate-pulse">
            Loading your personalized experience...
          </p>
        </div>
      </div>

    </div>
  );
};

export default AnimeLoadingScreen;