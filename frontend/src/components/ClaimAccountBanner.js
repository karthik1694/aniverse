import { useState } from 'react';
import { X } from 'lucide-react';

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
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-0.5 shadow-sm relative z-50">
      <div className="flex items-center justify-center gap-2">
        <p className="text-[7px] sm:text-xs leading-none">
          You're using an anonymous account.
        </p>
        <button
          onClick={handleClaim}
          className="btn-inline bg-white/20 hover:bg-white/30 text-white font-medium px-2 py-0 rounded text-[10px] sm:text-xs transition-colors border border-white/30 leading-none"
        >
          Claim Account
        </button>
        <button
          onClick={handleDismiss}
          className="btn-inline text-white/70 hover:text-white transition-colors leading-none"
          aria-label="Dismiss banner"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
