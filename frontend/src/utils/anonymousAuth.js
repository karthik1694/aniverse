/**
 * Anonymous Authentication Utility
 * Generates random anime character names for anonymous users
 */

// Large list of random anime character names
const ANIME_CHARACTER_NAMES = [
  // Popular anime characters
  'Naruto', 'Sasuke', 'Sakura', 'Kakashi', 'Hinata', 'Itachi', 'Gaara', 'Tsunade',
  'Luffy', 'Zoro', 'Nami', 'Sanji', 'Chopper', 'Robin', 'Franky', 'Brook',
  'Goku', 'Vegeta', 'Gohan', 'Piccolo', 'Bulma', 'Trunks', 'Goten', 'Krillin',
  'Ichigo', 'Rukia', 'Orihime', 'Uryu', 'Chad', 'Renji', 'Byakuya', 'Toshiro',
  'Edward', 'Alphonse', 'Winry', 'Roy', 'Riza', 'Mustang', 'Hughes', 'Scar',
  'Eren', 'Mikasa', 'Armin', 'Levi', 'Hange', 'Erwin', 'Jean', 'Sasha',
  'Tanjiro', 'Nezuko', 'Zenitsu', 'Inosuke', 'Giyu', 'Shinobu', 'Rengoku', 'Tengen',
  'Deku', 'Bakugo', 'Todoroki', 'Uraraka', 'Iida', 'Tsuyu', 'Kirishima', 'Momo',
  'Gon', 'Killua', 'Kurapika', 'Leorio', 'Hisoka', 'Ging', 'Meruem', 'Netero',
  'Saitama', 'Genos', 'Sonic', 'Tatsumaki', 'Fubuki', 'Bang', 'King', 'Mumen',
  'Light', 'L', 'Ryuk', 'Misa', 'Near', 'Mello', 'Matsuda', 'Soichiro',
  'Yuji', 'Megumi', 'Nobara', 'Gojo', 'Sukuna', 'Nanami', 'Maki', 'Panda',
  'Anya', 'Loid', 'Yor', 'Bond', 'Becky', 'Damian', 'Franky', 'Yuri',
  'Senku', 'Chrome', 'Gen', 'Kohaku', 'Suika', 'Ryusui', 'Tsukasa', 'Ukyo',
  'Rudeus', 'Eris', 'Sylphy', 'Roxy', 'Paul', 'Zenith', 'Ghislaine', 'Ruijerd',
  'Subaru', 'Emilia', 'Rem', 'Ram', 'Beatrice', 'Otto', 'Garfiel', 'Echidna',
  'Kazuma', 'Aqua', 'Megumin', 'Darkness', 'Wiz', 'Yunyun', 'Vanir', 'Eris',
  'Rimuru', 'Milim', 'Shion', 'Benimaru', 'Shuna', 'Diablo', 'Veldora', 'Hinata',
  'Asta', 'Yuno', 'Noelle', 'Luck', 'Magna', 'Yami', 'Mereoleona', 'Julius',
  'Thorfinn', 'Askeladd', 'Canute', 'Thors', 'Bjorn', 'Einar', 'Leif', 'Gudrid',
  'Violet', 'Gilbert', 'Hodgins', 'Cattleya', 'Benedict', 'Iris', 'Erica', 'Dietfried',
  'Spike', 'Jet', 'Faye', 'Ed', 'Ein', 'Vicious', 'Julia', 'Laughing',
  'Shinji', 'Asuka', 'Rei', 'Misato', 'Gendo', 'Ritsuko', 'Kaworu', 'Mari',
  'Lelouch', 'Suzaku', 'CC', 'Kallen', 'Shirley', 'Lloyd', 'Schneizel', 'Euphemia',
  'Kirito', 'Asuna', 'Sinon', 'Leafa', 'Silica', 'Klein', 'Agil', 'Yui',
  'Shiroe', 'Akatsuki', 'Naotsugu', 'Nyanta', 'Minori', 'Touya', 'Henrietta', 'Crusty',
  'Ainz', 'Albedo', 'Shalltear', 'Demiurge', 'Cocytus', 'Sebas', 'Mare', 'Aura',
  'Rin', 'Archer', 'Saber', 'Shirou', 'Sakura', 'Gilgamesh', 'Lancer', 'Rider',
  'Mob', 'Reigen', 'Dimple', 'Ritsu', 'Teru', 'Tome', 'Sho', 'Serizawa',
  'Meliodas', 'Elizabeth', 'Ban', 'King', 'Diane', 'Gowther', 'Merlin', 'Escanor',
  'Yato', 'Hiyori', 'Yukine', 'Bishamon', 'Kazuma', 'Kofuku', 'Daikoku', 'Nora',
  'Shinra', 'Arthur', 'Maki', 'Iris', 'Tamaki', 'Obi', 'Hinawa', 'Vulcan',
  'Naofumi', 'Raphtalia', 'Filo', 'Melty', 'Rishia', 'Ren', 'Motoyasu', 'Itsuki',
  'Tatsumi', 'Akame', 'Mine', 'Leone', 'Bulat', 'Sheele', 'Lubbock', 'Chelsea',
  'Yusuke', 'Kuwabara', 'Kurama', 'Hiei', 'Botan', 'Genkai', 'Koenma', 'Toguro',
  'Inuyasha', 'Kagome', 'Miroku', 'Sango', 'Shippo', 'Sesshomaru', 'Kikyo', 'Koga',
  'Kenshin', 'Kaoru', 'Sanosuke', 'Yahiko', 'Megumi', 'Aoshi', 'Saito', 'Shishio',
];

// Cool adjectives to make names more unique
const ADJECTIVES = [
  'Swift', 'Shadow', 'Silent', 'Mystic', 'Cosmic', 'Crimson', 'Azure', 'Golden',
  'Silver', 'Thunder', 'Blazing', 'Frozen', 'Phantom', 'Stellar', 'Lunar',
  'Solar', 'Neon', 'Electric', 'Cyber', 'Digital', 'Chrome', 'Plasma', 'Quantum',
  'Void', 'Echo', 'Nova', 'Omega', 'Alpha', 'Beta', 'Gamma', 'Delta',
  'Storm', 'Flame', 'Frost', 'Wind', 'Earth', 'Ocean', 'Sky', 'Star',
  'Moon', 'Sun', 'Dawn', 'Dusk', 'Night', 'Day', 'Dark', 'Light',
  'Wild', 'Calm', 'Fierce', 'Gentle', 'Bold', 'Shy', 'Brave', 'Kind',
];

/**
 * Generate a random anonymous username
 * Format: "Adjective + CharacterName + 3-digit number"
 * Example: "MysticNaruto420", "ShadowLuffy789"
 */
export const generateAnonymousUsername = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const character = ANIME_CHARACTER_NAMES[Math.floor(Math.random() * ANIME_CHARACTER_NAMES.length)];
  const number = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return `${adjective}${character}${number}`;
};

/**
 * Generate a random anonymous user ID
 */
export const generateAnonymousUserId = () => {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Create anonymous user session and store in localStorage
 */
export const createAnonymousSession = () => {
  const username = generateAnonymousUsername();
  const userId = generateAnonymousUserId();
  const sessionToken = `anon_token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  const anonymousUser = {
    id: userId,
    name: username,
    email: `${userId}@anonymous.temp`,
    isAnonymous: true,
    picture: null, // Will be generated with avatar generator
    bio: '',
    gender: null,
    favorite_anime: [],
    favorite_genres: [],
    favorite_themes: [],
    favorite_characters: [],
    premium: false,
    created_at: new Date().toISOString(),
  };
  
  // Store in localStorage
  localStorage.setItem('anonymous_user', JSON.stringify(anonymousUser));
  localStorage.setItem('anonymous_session_token', sessionToken);
  localStorage.setItem('user_id', userId);
  localStorage.setItem('session_token', sessionToken);
  
  return {
    user: anonymousUser,
    sessionToken,
  };
};

/**
 * Get existing anonymous session from localStorage
 */
export const getAnonymousSession = () => {
  try {
    const userStr = localStorage.getItem('anonymous_user');
    const sessionToken = localStorage.getItem('anonymous_session_token');
    
    if (userStr && sessionToken) {
      const user = JSON.parse(userStr);
      return {
        user,
        sessionToken,
      };
    }
  } catch (error) {
    console.error('Error getting anonymous session:', error);
  }
  
  return null;
};

/**
 * Clear anonymous session (when claiming account)
 */
export const clearAnonymousSession = () => {
  localStorage.removeItem('anonymous_user');
  localStorage.removeItem('anonymous_session_token');
};

/**
 * Check if user is anonymous
 */
export const isAnonymousUser = (user) => {
  return user && user.isAnonymous === true;
};
