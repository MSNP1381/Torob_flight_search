import React from 'react';
import { Card, Select, Button } from 'antd';
import {
  FilterOutlined,
  AimOutlined,
  TagOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  StarFilled,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  SlidersOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { FlightSortOption } from '../../types/flight';
import { PresetProfileName } from '../../algo';

export interface FlightSortToolbarProps {
  isDarkMode: boolean;
  sortBy: FlightSortOption;
  setSortBy: (sort: FlightSortOption) => void;
  selectedAlgoProfile: PresetProfileName;
  setSelectedAlgoProfile: (profile: PresetProfileName) => void;
  familyKidsCount: number;
  setFamilyKidsCount: (count: number) => void;
  familyAdultsCount: number;
  setFamilyAdultsCount: (count: number) => void;
  onOpenWeightDrawer: () => void;
}

export const FlightSortToolbar: React.FC<FlightSortToolbarProps> = ({
  isDarkMode,
  sortBy,
  setSortBy,
  selectedAlgoProfile,
  setSelectedAlgoProfile,
  familyKidsCount,
  setFamilyKidsCount,
  familyAdultsCount,
  setFamilyAdultsCount,
  onOpenWeightDrawer,
}) => {
  return (
    <Card
      className={`transition-colors duration-200 border rounded-2xl shadow-sm ${
        isDarkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'
      }`}
      styles={{ body: { padding: '14px 18px' } }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div
              className={`flex items-center gap-2 text-xs font-bold ${
                isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              <FilterOutlined className="text-blue-500" />
              <span>مرتب‌سازی نتایج:</span>
            </div>

            {/* Quick 1-Click Toggle Buttons */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto whitespace-nowrap scrollbar-none ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setSortBy('Algorithmic')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === 'Algorithmic'
                    ? isDarkMode
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                      : 'bg-white text-rose-700 shadow-sm border border-rose-300'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AimOutlined className="text-rose-500 text-xs" />
                <span>رتبه‌بندی ماتریسی هوشمند</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('Cheapest')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === 'Cheapest'
                    ? isDarkMode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'bg-white text-amber-700 shadow-sm border border-amber-300'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TagOutlined className="text-amber-500 text-xs" />
                <span>ارزان‌ترین نرخ</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('Fastest')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === 'Fastest'
                    ? isDarkMode
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                      : 'bg-white text-sky-700 shadow-sm border border-sky-300'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ThunderboltOutlined className="text-sky-500 text-xs" />
                <span>سریع‌ترین زمان</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy('Earliest')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === 'Earliest'
                    ? isDarkMode
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                      : 'bg-white text-indigo-700 shadow-sm border border-indigo-300'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClockCircleOutlined className="text-indigo-500 text-xs" />
                <span>زودترین پرواز</span>
              </button>
            </div>
          </div>

          {/* Active Sort Explanation */}
          <div
            className={`text-xs flex items-center gap-1.5 self-start sm:self-auto ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>مبنای چینش:</span>
            <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {sortBy === 'Algorithmic' && '🧠 ضرب ماتریس ویژگی‌های پرواز در بردار وزن‌های اهمیت'}
              {sortBy === 'Cheapest' && '💰 کمترین قیمت تمام‌شده مسافر'}
              {sortBy === 'Fastest' && '⚡ کوتاه‌ترین مدت زمان سفر'}
              {sortBy === 'Earliest' && '🌅 نزدیک‌ترین ساعت پرواز شبانه‌روز'}
            </span>
          </div>
        </div>

        {/* Ready Weight Presets Toolbar (When Algorithmic Ranking is active) */}
        {sortBy === 'Algorithmic' && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                  پروفایل وزن‌دهی:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAlgoProfile('bestDeal')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    selectedAlgoProfile === 'bestDeal'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <StarFilled className="text-[10px]" />
                  پیشنهاد برتر (متعادل)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlgoProfile('business')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    selectedAlgoProfile === 'business'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <UserOutlined className="text-[10px]" />
                  کاری (بیزنس)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlgoProfile('student')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    selectedAlgoProfile === 'student'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BookOutlined className="text-[10px]" />
                  دانشجویی (اقتصادی + بار)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlgoProfile('family')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    selectedAlgoProfile === 'family'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <TeamOutlined className="text-[10px]" />
                  خانوادگی (بدون توقف)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlgoProfile('fastest')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    selectedAlgoProfile === 'fastest'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ThunderboltOutlined className="text-[10px]" />
                  سریع‌ترین مسیر
                </button>
              </div>

              <Button
                size="small"
                onClick={onOpenWeightDrawer}
                icon={<SlidersOutlined />}
                className="text-xs rounded-xl flex items-center gap-1 font-semibold"
              >
                مشاهده فرمول و بردار وزن‌ها (W)
              </Button>
            </div>

            {/* Dynamic Family Passengers Adjuster */}
            {selectedAlgoProfile === 'family' && (
              <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs">
                <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <TeamOutlined />
                  تنظیم اعضای خانواده (تغییر خودکار وزن بار و توقف پرواز):
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-300">بزرگسال:</span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => setFamilyAdultsCount(Math.max(1, familyAdultsCount - 1))}
                      className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:text-purple-600 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                      {familyAdultsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFamilyAdultsCount(familyAdultsCount + 1)}
                      className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:text-purple-600 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-300">کودک:</span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => setFamilyKidsCount(Math.max(0, familyKidsCount - 1))}
                      className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:text-purple-600 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                      {familyKidsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFamilyKidsCount(familyKidsCount + 1)}
                      className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:text-purple-600 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                {familyKidsCount > 0 && (
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    (جریمه توقف افزایش یافت و بلیت‌های سیستمی اولویت گرفتند)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
