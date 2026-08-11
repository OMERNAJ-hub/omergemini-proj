import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showSubtext = true }) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Sleek Gradient Emblem Icon */}
      <div className={`relative flex items-center justify-center rounded-xl ${iconSizes[size]} bg-gradient-to-tr from-blue-600 to-emerald-500 shadow-lg shadow-blue-500/20 shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      </div>

      {/* Sleek Typography */}
      <div className="flex flex-col">
        <h1 className={`font-serif italic ${textSizes[size]} text-emerald-500 leading-tight tracking-tight`}>
          𝒪ℳ𝒩ℐ
        </h1>
        {showSubtext && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-sans -mt-1 font-semibold">
            Precision ERP Ecosystem
          </span>
        )}
      </div>
    </div>
  );
};

