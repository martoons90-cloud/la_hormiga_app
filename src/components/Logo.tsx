import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showTagline = true,
  size = 'md',
  compact = false,
}) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  if (compact) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500 text-zinc-950 font-black shadow-md border-2 border-zinc-900 overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]" />
          <svg className="w-6 h-6 text-zinc-950" viewBox="0 0 24 24" fill="currentColor">
            {/* Construction loader icon */}
            <path d="M4 17h16v2H4zM19 14h2v2h-2zM3 14h4v2H3z" />
            <path d="M7 11h10l-2-6H9L7 11zm8 0H9l1.3-4h3.4L15 11z" />
            <circle cx="6.5" cy="16.5" r="2.5" />
            <circle cx="17.5" cy="16.5" r="2.5" />
          </svg>
        </div>
        <div>
          <span className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            LA HORMIGA
          </span>
          {showTagline && (
            <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 leading-none">
              Flota & Maquinaria
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Mascot + Machine Icon SVG Representation */}
      <div className="relative flex-shrink-0">
        <svg
          viewBox="0 0 160 90"
          className={
            isSmall ? 'w-24 h-14' : isLarge ? 'w-44 h-24' : 'w-32 h-18'
          }
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ant worker mascot with hardhat */}
          {/* Ant Antennae */}
          <path d="M102 12 C100 4 104 2 108 3" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="108" cy="3" r="1.5" fill="#F59E0B" />
          <path d="M96 11 C93 3 89 2 85 4" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="85" cy="4" r="1.5" fill="#F59E0B" />

          {/* Yellow Hardhat */}
          <path
            d="M87 22 C87 14 113 14 113 22 Z"
            fill="#FBBF24"
            stroke="#18181B"
            strokeWidth="2"
          />
          <path d="M84 22 L116 22" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />

          {/* Ant Head */}
          <ellipse cx="100" cy="27" rx="10" ry="8" fill="#FDE68A" stroke="#18181B" strokeWidth="2" />
          {/* Big friendly cartoon eyes */}
          <ellipse cx="96" cy="25" rx="3.5" ry="4.5" fill="#FFFFFF" stroke="#18181B" strokeWidth="1.5" />
          <circle cx="97" cy="25" r="1.8" fill="#18181B" />
          <ellipse cx="104" cy="25" rx="3.5" ry="4.5" fill="#FFFFFF" stroke="#18181B" strokeWidth="1.5" />
          <circle cx="104" cy="25" r="1.8" fill="#18181B" />
          <path d="M97 31 Q100 34 104 31" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />

          {/* Yellow Safety Vest Body */}
          <path
            d="M93 35 L107 35 L109 56 L91 56 Z"
            fill="#F59E0B"
            stroke="#18181B"
            strokeWidth="2"
          />
          <path d="M98 35 L98 56" stroke="#18181B" strokeWidth="2" />
          <path d="M93 45 L107 45" stroke="#FFFFFF" strokeWidth="2.5" />

          {/* Ant Legs & Boots */}
          <path d="M94 56 L90 74 L84 76" stroke="#18181B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="84" cy="76" rx="5" ry="3" fill="#18181B" />
          <path d="M106 56 L110 74 L116 76" stroke="#18181B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="116" cy="76" rx="5" ry="3" fill="#18181B" />

          {/* Ant Arm greeting */}
          <path d="M108 40 L120 34 L126 26" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="126" cy="26" r="2.5" fill="#FDE68A" stroke="#18181B" strokeWidth="1" />

          {/* Yellow Skid Steer / Minicargadora */}
          {/* Cabin cage frame */}
          <path
            d="M26 38 L48 38 L54 52 L18 52 Z"
            fill="#3F3F46"
            stroke="#18181B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Cabin Window */}
          <path d="M30 42 L45 42 L48 50 L26 50 Z" fill="#93C5FD" opacity="0.85" />

          {/* Main Yellow Chassis */}
          <path
            d="M12 52 L58 52 L62 66 L10 66 Z"
            fill="#F59E0B"
            stroke="#18181B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Hazard stripes on body */}
          <path d="M40 54 L44 64" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
          <path d="M46 54 L50 64" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
          <path d="M52 54 L56 64" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />

          {/* Loader Arm */}
          <path d="M48 44 L16 58 L4 65" stroke="#18181B" strokeWidth="3" strokeLinecap="round" />

          {/* Front Scoop Bucket */}
          <path
            d="M4 56 L12 60 L10 74 L2 72 Z"
            fill="#FBBF24"
            stroke="#18181B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Rugged Wheels */}
          <circle cx="20" cy="70" r="10" fill="#18181B" />
          <circle cx="20" cy="70" r="6" fill="#71717A" />
          <circle cx="20" cy="70" r="3" fill="#18181B" />

          <circle cx="50" cy="70" r="10" fill="#18181B" />
          <circle cx="50" cy="70" r="6" fill="#71717A" />
          <circle cx="50" cy="70" r="3" fill="#18181B" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-black tracking-tighter text-zinc-950 leading-none ${
              isSmall ? 'text-xl' : isLarge ? 'text-3xl' : 'text-2xl'
            }`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            LA HORMIGA
          </span>
        </div>
        {showTagline && (
          <span
            className={`font-semibold tracking-normal text-zinc-800 italic mt-0.5 ${
              isSmall ? 'text-[11px]' : isLarge ? 'text-sm' : 'text-xs'
            }`}
          >
            Pequeños grandes movimientos
          </span>
        )}
      </div>
    </div>
  );
};
