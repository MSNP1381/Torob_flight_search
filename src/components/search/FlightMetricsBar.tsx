import React from 'react';
import { KeyOutlined, CheckCircleOutlined, ShopOutlined, SwapRightOutlined } from '@ant-design/icons';

export interface FlightMetricsBarProps {
  isDarkMode: boolean;
  rawOffersCount: number;
  totalUniqueFlights: number;
  multiProviderCount: number;
}

export const FlightMetricsBar: React.FC<FlightMetricsBarProps> = ({
  isDarkMode,
  rawOffersCount,
  totalUniqueFlights,
  multiProviderCount,
}) => {
  return (
    <div
      className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center gap-6">
        {/* Raw Offers */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
            🛒
          </div>
          <div>
            <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>کل آفرهای خام</div>
            <div className="font-black text-amber-500 font-mono text-sm">
              {rawOffersCount.toLocaleString('fa-IR')} پیشنهاد
            </div>
          </div>
        </div>

        <div className={`hidden sm:block h-6 w-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        {/* Unique Physical Flights */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
            ✈️
          </div>
          <div>
            <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>پروازهای فیزیکی یکپارچه</div>
            <div className="font-black text-emerald-500 font-mono text-sm">
              {totalUniqueFlights.toLocaleString('fa-IR')} پرواز مجزا
            </div>
          </div>
        </div>

        <div className={`hidden sm:block h-6 w-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        {/* Multi-provider Competition */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
            🏷️
          </div>
          <div>
            <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>رقابت چندتامین‌کننده‌ای</div>
            <div className="font-black text-blue-500 font-mono text-sm">
              {multiProviderCount.toLocaleString('fa-IR')} پرواز رقابتی
            </div>
          </div>
        </div>
      </div>

      <div
        className={`font-mono text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
          isDarkMode
            ? 'bg-slate-950/60 border-slate-800 text-slate-400'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <KeyOutlined className="text-amber-500" />
        <span>فرمول یکپارچه‌سازی: AIRLINE_NUM_ORG_DST_TIME_CABIN</span>
      </div>
    </div>
  );
};
