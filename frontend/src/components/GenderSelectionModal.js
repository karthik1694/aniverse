import { useState } from 'react';
import { Button } from './ui/button';
import { User, UserCheck } from 'lucide-react';

export default function GenderSelectionModal({ isOpen, onClose, onGenderSelect }) {
  const [selectedGender, setSelectedGender] = useState('');
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
  };

  const handleContinue = () => {
    if (selectedGender && isAgeConfirmed) {
      onGenderSelect(selectedGender);
      onClose();
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-3 sm:p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f1419]/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl shadow-cyan-500/10 relative max-h-[90vh] overflow-y-auto">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-4 right-6 w-1 h-1 bg-cyan-400/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-4 w-1 h-1 bg-blue-400/35 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Before you start...</h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Select your gender so we can match you with the right people.
            </p>
          </div>

          {/* Gender Selection */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">I am:</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => handleGenderSelect('male')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 ${
                  selectedGender === 'male'
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                }`}
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm sm:text-base">Male</span>
              </button>
              <button
                onClick={() => handleGenderSelect('female')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 ${
                  selectedGender === 'female'
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                }`}
              >
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm sm:text-base">Female</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 sm:mt-3 text-center">
              *You cannot change your gender after you register.
            </p>
          </div>

          {/* Age Confirmation */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start gap-2 sm:gap-3">
              <input
                type="checkbox"
                id="ageConfirm"
                checked={isAgeConfirmed}
                onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                className="mt-0.5 sm:mt-1 w-4 h-4 text-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2 flex-shrink-0"
              />
              <label htmlFor="ageConfirm" className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                I'm at least <span className="text-orange-400 font-semibold">18 years old</span> and have read and agree to the{' '}
                <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer underline">Terms of Service</span> and{' '}
                <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer underline">Privacy Policy</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <Button
              onClick={handleContinue}
              disabled={!selectedGender || !isAgeConfirmed}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none text-sm sm:text-base"
            >
              I AGREE, LET'S GO!
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
}