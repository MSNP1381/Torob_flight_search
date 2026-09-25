import React from 'react';
import { Tag, Progress } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  ThunderboltFilled,
  SyncOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { ProviderProgressStatus } from '../../types/flight';
import { ProviderType } from '../ProviderLogo';

export interface ProviderProgressTrackerProps {
  isDarkMode: boolean;
  isSearching: boolean;
  providerProgress: Record<string, ProviderProgressStatus>;
  selectedProviders: ProviderType[];
  routeNotice?: string;
}

const PROVIDER_METADATA: Record<string, { nameFa: string; color: string; badgeBg: string; logoText: string }> = {
  alibaba: {
    nameFa: 'علی‌بابا (Alibaba)',
    color: '#ff9800',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    logoText: 'ALI',
  },
  flytoday: {
    nameFa: 'فلای‌تودی (FlyToday)',
    color: '#2196f3',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    logoText: 'FT',
  },
  safarmarket: {
    nameFa: 'سفرمارکت (SafarMarket)',
    color: '#e91e63',
    badgeBg: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    logoText: 'SM',
  },
};

export const ProviderProgressTracker: React.FC<ProviderProgressTrackerProps> = ({
  isDarkMode,
  isSearching,
  providerProgress,
  selectedProviders,
  routeNotice,
}) => {
  const activeKeys = selectedProviders.length > 0 ? selectedProviders : ['alibaba', 'flytoday', 'safarmarket'];

  const completedCount = activeKeys.filter((k) => {
    const item = providerProgress[k];
    return item?.isFinished && item?.status === 'COMPLETED';
  }).length;

  const finishedCount = activeKeys.filter((k) => providerProgress[k]?.isFinished).length;
  const totalCount = activeKeys.length;
  const progressPercent = isSearching && finishedCount < totalCount
    ? Math.max(15, Math.round((finishedCount / totalCount) * 100))
    : 100;

  return (
    <div
      className={`border rounded-2xl p-4 shadow-sm transition-all duration-200 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-sm font-bold">
            {isSearching ? <SyncOutlined spin /> : <ThunderboltFilled />}
          </div>
          <div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              وضعیت واکشی همزمان ارائه‌دهندگان (Live Progress)
            </span>
            <span className={`text-xs ml-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              پروکسی فعال: <span className="font-mono text-emerald-500">127.0.0.1:2080</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tag
            color={completedCount === totalCount ? 'success' : isSearching ? 'processing' : 'warning'}
            className="rounded-full px-3 py-0.5 text-xs font-medium"
          >
            {isSearching
              ? `در حال واکشی (${finishedCount}/${totalCount})`
              : completedCount === totalCount
              ? `همه تکمیل شدند (${completedCount}/${totalCount})`
              : `${completedCount} از ${totalCount} تکمیل شد`}
          </Tag>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Progress
          percent={progressPercent}
          status={isSearching ? 'active' : completedCount === totalCount ? 'success' : 'normal'}
          showInfo={false}
          strokeColor={{
            '0%': '#3b82f6',
            '50%': '#10b981',
            '100%': '#06b6d4',
          }}
          size={['100%', 6]}
        />
      </div>

      {/* Provider Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {activeKeys.map((key) => {
          const meta = PROVIDER_METADATA[key] || {
            nameFa: key,
            color: '#64748b',
            badgeBg: 'bg-slate-500/10 text-slate-600',
            logoText: key.slice(0, 2).toUpperCase(),
          };
          const progress = providerProgress[key];

          const isFinished = progress?.isFinished ?? false;
          const status = progress?.status ?? (isSearching ? 'IN_PROGRESS' : 'PENDING');
          const count = progress?.offersCount ?? 0;
          const durationSec = progress?.durationMs ? (progress.durationMs / 1000).toFixed(1) : undefined;

          let statusIcon = <ClockCircleFilled className="text-amber-500" />;
          let statusText = 'در صف پردازش';
          let borderStyle = isDarkMode ? 'border-slate-800' : 'border-slate-200';

          if (isSearching && !isFinished) {
            statusIcon = <SyncOutlined spin className="text-blue-500" />;
            statusText = 'در حال واکشی زنده...';
            borderStyle = 'border-blue-500/40 bg-blue-500/5';
          } else if (isFinished && status === 'COMPLETED') {
            statusIcon = <CheckCircleFilled className="text-emerald-500" />;
            statusText = count > 0 ? `پایان یافت (${count.toLocaleString('fa-IR')} بلیت)` : 'بدون پرواز';
            borderStyle = isDarkMode
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-emerald-200 bg-emerald-50/50';
          } else if (isFinished && status === 'FAILED') {
            statusIcon = <CloseCircleFilled className="text-rose-500" />;
            statusText = 'خطا در ارتباط';
            borderStyle = isDarkMode
              ? 'border-rose-500/30 bg-rose-500/5'
              : 'border-rose-200 bg-rose-50/50';
          }

          return (
            <div
              key={key}
              className={`border rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 ${borderStyle} ${
                isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-black font-mono text-[10px] px-1.5 py-0.5 rounded border ${meta.badgeBg}`}
                  >
                    {meta.logoText}
                  </span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {meta.nameFa}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {statusIcon}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                <span className={status === 'COMPLETED' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                  {statusText}
                </span>
                {durationSec && (
                  <span className="font-mono text-[10px] text-slate-400">
                    {durationSec}s
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Route Notice if Auto-corrected */}
      {routeNotice && (
        <div
          className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
            isDarkMode
              ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <InfoCircleOutlined className="text-amber-500 flex-shrink-0" />
          <span>{routeNotice}</span>
        </div>
      )}
    </div>
  );
};
