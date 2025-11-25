import React from 'react';

const TypingIndicator = ({ isTyping, userName = "Someone" }) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-start gap-3 px-2 py-1 animate-fade-in">
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-1 bg-gray-600">
        💭
      </div>
      
      {/* Typing content */}
      <div className="flex-1 min-w-0">
        {/* Username */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-gray-400 text-sm italic">
            {userName}
          </span>
        </div>
        
        {/* Typing animation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#212d3d]/60 rounded-lg px-3 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-1"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-2"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot-3"></div>
            </div>
          </div>
          <span className="text-xs text-gray-500 italic">is typing...</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;