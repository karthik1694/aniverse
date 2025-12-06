import React from 'react';
import { Heart } from 'lucide-react';

const AnimeLoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] text-white relative overflow-hidden">
      {/* Clean Background - Subtle gradient overlays only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle Gradient Overlays */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-cyan-500/8 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-purple-500/8 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-500/5 via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 text-center">
        {/* Logo/Brand */}
        <div className="mb-8 animate-float">
          {/* Cute Coffee Cup Logo */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-full shadow-2xl shadow-cyan-500/30 mx-auto w-28 h-28 flex items-center justify-center mb-6">
            <svg viewBox="0 0 100 100" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cup body */}
              <ellipse cx="50" cy="72" rx="26" ry="18" fill="white"/>
              <rect x="24" y="48" width="52" height="28" rx="4" fill="white"/>
              
              {/* Cup handle */}
              <path d="M76 52 C88 52, 92 65, 76 68" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
              
              {/* Steam lines */}
              <path d="M35 38 Q38 28, 35 18" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" className="animate-pulse"/>
              <path d="M50 35 Q53 25, 50 15" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
              <path d="M65 38 Q68 28, 65 18" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
              
              {/* Anime eyes */}
              <ellipse cx="38" cy="58" rx="5" ry="7" fill="#1a1a2e"/>
              <ellipse cx="62" cy="58" rx="5" ry="7" fill="#1a1a2e"/>
              
              {/* Eye highlights */}
              <circle cx="40" cy="56" r="2" fill="white"/>
              <circle cx="64" cy="56" r="2" fill="white"/>
              
              {/* Cute smile */}
              <path d="M42 67 Q50 74, 58 67" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round"/>
              
              {/* Blush */}
              <ellipse cx="30" cy="64" rx="4" ry="2" fill="#ff9999" opacity="0.6"/>
              <ellipse cx="70" cy="64" rx="4" ry="2" fill="#ff9999" opacity="0.6"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            otakucafe<span className="text-cyan-400">.fun</span>
          </h1>
          <p className="text-gray-400 text-lg font-medium">
            Connecting anime souls worldwide
          </p>
        </div>

        {/* Simple Loading Indicator */}
        <div className="mb-8">
          {/* Loading Dots */}
          <div className="flex justify-center space-x-3 mb-6">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          </div>

          {/* Loading Text */}
          <div className="text-lg text-gray-300 font-medium">
            Preparing your anime adventure...
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 max-w-xs mx-auto">
          <div className="bg-gray-800/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full rounded-full animate-progress-fill"></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AnimeLoadingScreen;