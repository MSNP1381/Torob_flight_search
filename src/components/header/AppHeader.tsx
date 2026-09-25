import React from 'react';
import { Layout, Tooltip, Switch, Badge } from 'antd';
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

const { Header } = Layout;

export interface AppHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  firebaseConnected: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  isAdminMode: boolean;
  onOpenSessionModal: () => void;
  onSecretTrigger: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  onToggleTheme,
  firebaseConnected,
  historyCount,
  onOpenHistory,
  isAdminMode,
  onOpenSessionModal,
  onSecretTrigger,
}) => {
  return (
    <Header
      className={`px-4 sm:px-6 h-auto py-3 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#0b1324]/90 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              onClick={onSecretTrigger}
              title="سامانه تجمیع پرواز ترب / BuyO (برای باز کردن پنل ادمین ۳ بار کلیک کنید)"
              className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <RocketOutlined className="text-lg transform -rotate-45" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-amber-400 dark:via-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
                  موتور تجمیع پرواز ترب (BuyO)
                </span>

                <span
                  className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                    isDarkMode
                      ? 'bg-blue-950/40 text-blue-300 border-blue-800/50'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  ۳ کراولر همزمان
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                    isDarkMode
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  }`}
                  title="پایگاه داده محلی SQLite متصل است"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  SQLite فعال
                </span>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                    firebaseConnected
                      ? isDarkMode
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                >
                  {firebaseConnected ? '🔥 کلاد' : 'آفلاین'}
                </span>
              </div>
              <p className={`text-[11px] m-0 hidden sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                یکپارچه‌سازی و رتبه‌بندی بلادرنگ پروازها از علی‌بابا، فلای‌تودی و سفرمارکت
              </p>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <div className="flex items-center gap-2">
            <Tooltip title={isDarkMode ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="تغییر حالت تم"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-slate-700'
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('grouped_search')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              activeTab === 'grouped_search'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
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
                ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/60'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border-slate-200'
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
                ? 'bg-blue-600 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
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
                ? 'bg-blue-600 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
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
                ? 'bg-blue-600 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <DatabaseOutlined />
            <span>دیتابیس</span>
          </button>

          {isAdminMode && (
            <button
              type="button"
              onClick={onOpenSessionModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer border ${
                isDarkMode
                  ? 'bg-amber-950/40 text-amber-300 border-amber-600/50 hover:bg-amber-900/60'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="پنل مدیریت داخلی: کوکی‌ها، اعتبارنامه‌ها و پروکسی ایران (Ctrl+Shift+C)"
            >
              <SafetyCertificateOutlined />
              <span className="font-mono text-[11px]">پروکسی و کوکی‌ها</span>
            </button>
          )}
        </div>
      </div>
    </Header>
  );
};
