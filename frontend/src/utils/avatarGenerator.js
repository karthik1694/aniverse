/**
 * Generate unique avatar colors and patterns based on user data
 * Similar to ChitChat.gg's unique avatar system
 */

// Vibrant color palette for avatars - all with white text for consistency
const AVATAR_COLORS = [
  { bg: '#FF6B6B', text: '#FFFFFF' }, // Red
  { bg: '#4ECDC4', text: '#FFFFFF' }, // Teal
  { bg: '#45B7D1', text: '#FFFFFF' }, // Blue
  { bg: '#FFA07A', text: '#FFFFFF' }, // Light Salmon
  { bg: '#98D8C8', text: '#FFFFFF' }, // Mint
  { bg: '#F39C12', text: '#FFFFFF' }, // Orange (darker for better contrast)
  { bg: '#BB8FCE', text: '#FFFFFF' }, // Purple
  { bg: '#85C1E2', text: '#FFFFFF' }, // Sky Blue
  { bg: '#E67E22', text: '#FFFFFF' }, // Dark Orange
  { bg: '#52B788', text: '#FFFFFF' }, // Green
  { bg: '#E63946', text: '#FFFFFF' }, // Crimson
  { bg: '#457B9D', text: '#FFFFFF' }, // Steel Blue
  { bg: '#E76F51', text: '#FFFFFF' }, // Burnt Orange
  { bg: '#2A9D8F', text: '#FFFFFF' }, // Teal Green
  { bg: '#D4A373', text: '#FFFFFF' }, // Brown (darker for better contrast)
  { bg: '#F4A261', text: '#FFFFFF' }, // Sandy Brown
  { bg: '#264653', text: '#FFFFFF' }, // Dark Blue
  { bg: '#9B59B6', text: '#FFFFFF' }, // Amethyst
  { bg: '#3498DB', text: '#FFFFFF' }, // Dodger Blue
  { bg: '#E74C3C', text: '#FFFFFF' }, // Alizarin
];

/**
 * Generate a consistent hash from a string
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get initials from a name (1-2 characters)
 */
function getInitials(name) {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Generate unique avatar data based on user info
 */
export function generateAvatar(user) {
  if (!user) {
    return {
      initials: '?',
      backgroundColor: '#6B7280',
      textColor: '#FFFFFF',
      pattern: 'solid'
    };
  }

  // Use user ID or email for consistency
  const seed = user.id || user.email || user.name || 'default';
  const hash = hashString(seed);
  
  // Select color based on hash
  const colorIndex = hash % AVATAR_COLORS.length;
  const colors = AVATAR_COLORS[colorIndex];
  
  // Get initials
  const initials = getInitials(user.name);
  
  // Determine pattern (optional, for more variety)
  const patterns = ['solid', 'gradient', 'dots'];
  const patternIndex = Math.floor(hash / AVATAR_COLORS.length) % patterns.length;
  
  return {
    initials,
    backgroundColor: colors.bg,
    textColor: colors.text,
    pattern: patterns[patternIndex],
    seed: hash
  };
}

/**
 * Generate gradient background based on seed
 */
export function getGradientStyle(seed) {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  ];
  
  const index = seed % gradients.length;
  return gradients[index];
}

export default generateAvatar;
