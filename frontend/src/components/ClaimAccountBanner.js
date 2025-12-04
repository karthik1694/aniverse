import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Banner that appears at the top for anonymous users
 * Similar to chitchat.gg's approach
 */
export default function ClaimAccountBanner({ onClaim, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleClaim = () => {
    if (onClaim) {
      onClaim();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 sm:px-3 py-1 shadow-sm relative z-50">
      <div className="max-w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <p className="text-[10px] sm:text-xs text-center sm:text-left">
            You're using an anonymous account. All changes will be lost after logging out.
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            onClick={handleClaim}
            className="bg-white hover:bg-gray-100 text-orange-600 font-medium px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-xs transition-all duration-200 h-5"
          >
            Claim Account
          </Button>
          
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
