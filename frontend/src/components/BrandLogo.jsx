import React, { useId } from 'react';

/**
 * OtakuCafe brand logo — a cyan→blue→purple "otaku cafe" coffee mark
 * with gold steam + sparkle, matching the site's theme.
 *
 * Props:
 *  - size: 'sm' | 'md' | 'lg' | 'xl'
 *  - showText: render the wordmark next to the mark
 *  - iconOnly: render just the badge (no wordmark)
 */
const SIZES = { sm: 24, md: 34, lg: 44, xl: 88 };

export function LogoMark({ size = 'md', className = '' }) {
  const px = SIZES[size] || SIZES.md;
  const uid = useId().replace(/:/g, '');
  const bg = `bg-${uid}`;
  const glow = `glow-${uid}`;
  const spark = `spark-${uid}`;
  const cup = `cup-${uid}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-[0_4px_10px_rgba(34,211,238,0.35)] ${className}`}
      role="img"
      aria-label="OtakuCafe"
    >
      <defs>
        <linearGradient id={bg} x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id={glow} cx="0.3" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={spark} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={cup} x1="170" y1="200" x2="320" y2="352" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e7f0fb" />
        </linearGradient>
      </defs>

      <rect x="40" y="40" width="432" height="432" rx="116" fill={`url(#${bg})`} />
      <rect x="40" y="40" width="432" height="432" rx="116" fill={`url(#${glow})`} />
      <rect x="41" y="41" width="430" height="430" rx="115" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="2" />

      <g stroke={`url(#${spark})`} strokeWidth="9" strokeLinecap="round" fill="none">
        <path d="M214 190 c-16 -18 16 -30 2 -50 c-10 -14 6 -24 0 -34" opacity="0.85">
          <animate attributeName="opacity" values="0.5;0.95;0.5" dur="2.4s" repeatCount="indefinite" />
        </path>
        <path d="M256 194 c-16 -18 16 -30 2 -54 c-12 -16 8 -26 0 -40" opacity="0.95">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M298 190 c-16 -18 16 -30 2 -50 c-10 -14 6 -24 0 -34" opacity="0.8">
          <animate attributeName="opacity" values="0.45;0.9;0.45" dur="2.7s" repeatCount="indefinite" />
        </path>
      </g>

      <path d="M372 126 l10 26 26 10 -26 10 -10 26 -10 -26 -26 -10 26 -10 Z" fill={`url(#${spark})`}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
      </path>
      <circle cx="150" cy="312" r="6" fill={`url(#${spark})`} opacity="0.85" />

      <path d="M172 214 L340 214 L322 332 C318 346 308 352 296 352 L216 352 C204 352 194 346 190 332 Z" fill={`url(#${cup})`} />
      <rect x="158" y="202" width="196" height="26" rx="13" fill="#ffffff" />
      <path d="M342 240 q58 6 58 42 q0 36 -58 42" fill="none" stroke="#ffffff" strokeWidth="20" strokeLinecap="round" />
      <ellipse cx="256" cy="215" rx="78" ry="11" fill="#0a0e1a" opacity="0.10" />
    </svg>
  );
}

export default function BrandLogo({ size = 'md', showText = true, iconOnly = false, className = '' }) {
  if (iconOnly) {
    return <LogoMark size={size} className={className} />;
  }

  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className={`${textSize} font-black text-white tracking-tight leading-none`}>
          otaku
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">cafe</span>
          <span className="text-[0.62em] text-purple-400">.fun</span>
        </span>
      )}
    </div>
  );
}
