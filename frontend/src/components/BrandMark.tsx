import React from 'react';

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = 'w-7 h-7', size = 30 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Precision Docket Card Base */}
      <rect width="36" height="36" rx="9" fill="#F6F0E6" stroke="#D8CEC0" strokeWidth="1.2" />

      {/* Lens A: Standard Check (Cobalt dashed aperture) */}
      <circle
        cx="14.5"
        cy="18"
        r="8.5"
        stroke="#2563EB"
        strokeWidth="2"
        strokeDasharray="2.5 1.5"
        opacity="0.9"
      />

      {/* Lens B: Quantum Shape Check (Vivid Coral aperture) */}
      <circle
        cx="21.5"
        cy="18"
        r="8.5"
        stroke="#F43F5E"
        strokeWidth="2"
      />

      {/* Converged Center Signal Star: The verified review */}
      <path
        d="M18 10.5L19.5 16.5L25.5 18L19.5 19.5L18 25.5L16.5 19.5L10.5 18L16.5 16.5Z"
        fill="#0F172A"
      />

      {/* Acid-Lime Core Inspection Node */}
      <circle cx="18" cy="18" r="2.2" fill="#84CC16" />

      {/* Optical Alignment Caliper Ticks */}
      <line x1="18" y1="4.5" x2="18" y2="7.5" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="18" y1="28.5" x2="18" y2="31.5" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  className?: string;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  size = 'md',
  subtitle = 'Dual-Check Review Engine',
  className = '',
}) => {
  const titleSizeClass =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl';
  const iconSize = size === 'sm' ? 26 : size === 'lg' ? 38 : 32;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <BrandMark size={iconSize} className="shadow-xs transition-transform hover:scale-105" />
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-editorial font-bold tracking-tight text-[#0F172A] ${titleSizeClass}`}>
            Trust<span className="text-[#2563EB]">Rate</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] self-start mt-1"></span>
        </div>
        {subtitle && (
          <span className="text-[10px] text-[#64748B] font-mono tracking-tight block mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
