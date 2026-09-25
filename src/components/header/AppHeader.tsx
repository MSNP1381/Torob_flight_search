import React from 'react';
import { Tooltip } from 'antd';
import {
  RocketOutlined,
  ApartmentOutlined,
  HistoryOutlined,
  GlobalOutlined,
  KeyOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';

export interface AppHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  sqliteConnected?: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  isAdminMode: boolean;
  onOpenSessionModal: () => void;
  onSecretTrigger: () => void;
  selectedProvidersCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  onToggleTheme,
  sqliteConnected = true,
  historyCount,
  onOpenHistory,
  isAdminMode,
  onOpenSessionModal,
  onSecretTrigger,
  selectedProvidersCount = 3,
}) => {
  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md shadow-xs border-b transition-colors duration-200 ${
        isDarkMode
          ? 'bg-slate-950/95 border-slate-800/80 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
      style={{ lineHeight: 'normal' }}
    >
      {/* Top Bar: Brand, Status Indicators & System Actions */}
      <div className="border-b border-slate-100 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Identity & Real-time Status Badges */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Rocket Logo Icon (3-clicks secret admin trigger) */}
            <div
              onClick={onSecretTrigger}
              title="سامانه تجمیع پرواز ترب (برای باز کردن پنل ادمین ۳ بار کلیک کنید)"
              className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <RocketOutlined className="text-base transform -rotate-45" />
            </div>

            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Main Title */}
              <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-sky-400 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent truncate">
                موتور تجمیع پرواز ترب
              </span>

              {/* Crawlers Count Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border flex-shrink-0 ${
                  isDarkMode
                    ? 'bg-blue-950/50 text-blue-300 border-blue-800/50'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {selectedProvidersCount} کراولر فعال
              </span>

              {/* SQLite Health Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border flex-shrink-0 ${
                  sqliteConnected
                    ? isDarkMode
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : isDarkMode
                    ? 'bg-rose-950/50 text-rose-300 border-rose-800/40'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}
                title={sqliteConnected ? 'پایگاه داده محلی SQLite متصل است' : 'عدم دسترسی به پایگاه داده SQLite'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    sqliteConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                ></span>
                {sqliteConnected ? '💾 SQLite فعال' : '⚠️ SQLite آفلاین'}
              </span>

              {/* Subtitle tag on larger screens */}
              <span className="hidden xl:inline text-[11px] text-slate-400 dark:text-slate-500 font-normal mr-2">
                یکپارچه‌سازی و رتبه‌بندی بلادرنگ پروازها
              </span>
            </div>
          </div>

          {/* Right Action Tools: Admin button & Theme Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdminMode && (
              <button
                type="button"
                onClick={onOpenSessionModal}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isDarkMode
                    ? 'bg-amber-950/40 text-amber-300 border-amber-600/50 hover:bg-amber-900/60'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
                title="پنل مدیریت داخلی: کوکی‌ها، اعتبارنامه‌ها و پروکسی ایران (Ctrl+Shift+C)"
              >
                <SafetyCertificateOutlined />
                <span className="font-mono text-[11px] hidden sm:inline">پروکسی و کوکی‌ها</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <Tooltip title={isDarkMode ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="تغییر حالت تم"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-slate-800/90 hover:bg-slate-800 text-amber-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-xs'
                }`}
              >
                {isDarkMode ? (
                  <MoonOutlined className="text-amber-300 text-sm" />
                ) : (
                  <SunOutlined className="text-amber-500 text-sm" />
                )}
                <span className="text-[11px] hidden sm:inline">
                  {isDarkMode ? 'تم تیره' : 'تم روشن'}
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Tab Navigation Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('grouped_search')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            activeTab === 'grouped_search'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : isDarkMode
              ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ApartmentOutlined />
          <span>جستجوی پرواز</span>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer border ${
            isDarkMode
              ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
              : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
          }`}
          title="مشاهده تاریخچه استعلام‌های ذخیره شده در SQLite"
        >
          <HistoryOutlined className="text-emerald-500" />
          <span>تاریخچه استعلام‌ها</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-mono rounded-full text-[10px]">
              {historyCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('airports')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            activeTab === 'airports'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : isDarkMode
              ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <GlobalOutlined />
          <span>بانک فرودگاه‌ها (۹,۳۲۰)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('key_sandbox')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            activeTab === 'key_sandbox'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : isDarkMode
              ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <KeyOutlined />
          <span>آزمایشگاه کلید</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('db_bootstrap')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            activeTab === 'db_bootstrap'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : isDarkMode
              ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <DatabaseOutlined />
          <span>دیتابیس</span>
        </button>
      </div>
    </header>
  );
};
