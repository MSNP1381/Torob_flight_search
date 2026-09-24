import React from 'react';
import { Tooltip } from 'antd';

export type ProviderType = 'alibaba' | 'flytoday' | 'safarmarket';

interface ProviderLogoProps {
  provider: ProviderType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  compact?: boolean;
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  provider,
  size = 'sm',
  showLabel = true,
  compact = false,
}) => {
  const p = provider.toLowerCase();

  const sizeClasses = {
    xs: 'h-5 px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'h-6 px-2 py-0.5 text-xs gap-1.5',
    md: 'h-8 px-2.5 py-1 text-xs gap-2',
    lg: 'h-10 px-3.5 py-1.5 text-sm gap-2.5',
  }[size];

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  if (p === 'alibaba') {
    const content = (
      <div
        className={`inline-flex items-center rounded-md font-bold transition select-none ${sizeClasses} bg-[#FDB713] text-slate-950 shadow-sm border border-amber-400`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${iconSizes} flex-shrink-0`}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c2.4 0 4.5 1.1 5.9 2.8l-1.6 1.4C15.2 8 13.7 7.2 12 7.2s-3.2.8-4.3 2L6.1 7.8C7.5 6.1 9.6 5 12 5zm-5 8c0-.7.2-1.4.6-2l1.6 1.2c-.1.3-.2.5-.2.8 0 1.7 1.3 3 3 3s3-1.3 3-3c0-.3-.1-.5-.2-.8l1.6-1.2c.4.6.6 1.3.6 2 0 2.8-2.2 5-5 5s-5-2.2-5-5z" />
          <path d="M8 11a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" />
        </svg>
        {showLabel && !compact && (
          <span className="font-extrabold tracking-tight">علی‌بابا</span>
        )}
      </div>
    );
    return compact ? <Tooltip title="علی‌بابا (Alibaba.ir)">{content}</Tooltip> : content;
  }

  if (p === 'flytoday') {
    const content = (
      <div
        className={`inline-flex items-center rounded-md font-bold transition select-none ${sizeClasses} bg-[#002D62] text-white shadow-sm border border-blue-600/50`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${iconSizes} text-[#00A3E0] flex-shrink-0`}>
          <path
            d="M3 13.5L21 3L13.5 21L10.5 13.5L3 13.5Z"
            fill="#00A3E0"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10.5 13.5L21 3" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
        {showLabel && !compact && (
          <span className="font-extrabold tracking-tight text-[#38BDF8]">
            فلای‌تودی
          </span>
        )}
      </div>
    );
    return compact ? <Tooltip title="فلای‌تودی (FlyToday.ir)">{content}</Tooltip> : content;
  }

  if (p === 'safarmarket') {
    const content = (
      <div
        className={`inline-flex items-center rounded-md font-bold transition select-none ${sizeClasses} bg-gradient-to-r from-[#E11D48] to-[#EA580C] text-white shadow-sm border border-rose-500/40`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={`${iconSizes} flex-shrink-0`}>
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <path d="M16 8L13 13L8 16L11 11L16 8Z" fill="white" />
          <circle cx="12" cy="12" r="2" fill="#E11D48" />
        </svg>
        {showLabel && !compact && (
          <span className="font-extrabold tracking-tight">سفرمارکت</span>
        )}
      </div>
    );
    return compact ? <Tooltip title="سفرمارکت (SafarMarket.com)">{content}</Tooltip> : content;
  }

  // Fallback generic badge
  return (
    <div className={`inline-flex items-center rounded-md font-semibold bg-slate-800 text-slate-200 border border-slate-700 ${sizeClasses}`}>
      <span className="uppercase">{provider}</span>
    </div>
  );
};
