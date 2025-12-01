import React from 'react';
import { generateAvatar, getGradientStyle } from '../utils/avatarGenerator';

/**
 * UserAvatar component - Generates unique, colorful avatars like ChitChat.gg
 * Falls back to initials if no picture is available
 */
const UserAvatar = ({ user, size = 'md', className = '' }) => {
  // Size variants
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const sizeClass = sizes[size] || sizes.md;

  const [imageError, setImageError] = React.useState(false);

  // Generate unique avatar
  const avatar = generateAvatar(user);

  // If user has a picture and it hasn't errored, try to use it
  if (user?.picture && !imageError) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={user.picture}
          alt={user.name || 'User'}
          className="w-full h-full object-cover"
          onError={() => {
            setImageError(true);
          }}
        />
      </div>
    );
  }

  // Apply pattern-based styling
  const getPatternStyle = () => {
    if (avatar.pattern === 'gradient') {
      return {
        background: getGradientStyle(avatar.seed),
      };
    } else if (avatar.pattern === 'dots') {
      return {
        backgroundColor: avatar.backgroundColor,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '4px 4px',
      };
    } else {
      return {
        backgroundColor: avatar.backgroundColor,
      };
    }
  };

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold ${className}`}
      style={{
        ...getPatternStyle(),
        color: avatar.textColor,
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
      title={user?.name || 'User'}
    >
      <span className="select-none">{avatar.initials}</span>
    </div>
  );
};

export default UserAvatar;
