import React from 'react';
import { Drawer, Button, Tag } from 'antd';
import { HistoryOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { SqliteSearchItem, AirportOption } from '../../types/flight';
import { formatToman } from '../../utils/formatters';

export interface SearchHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  searches: SqliteSearchItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectSearch: (search: SqliteSearchItem) => void;
}

export const SearchHistoryDrawer: React.FC<SearchHistoryDrawerProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  searches,
  isLoading,
  onRefresh,
  onSelectSearch,
}) => {
  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-base flex items-center gap-2">
            <HistoryOutlined className="text-emerald-500" />
            تاریخچه استعلام‌های ذخیره شده در SQLite
          </span>
          <Tag color="cyan" className="font-mono text-xs">
            data/torob.sqlite
          </Tag>
        </div>
      }
      open={isOpen}
      onClose={onClose}
      placement="right"
      width={460}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
          <span className="text-xs text-slate-400">
            تعداد کل استعلام‌های ثبت‌شده: <b>{searches.length}</b>
          </span>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={onRefresh}
          >
            بروزرسانی
          </Button>
        </div>

        {searches.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            هنوز هیچ جستجویی در دیتابیس لوکال ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-2.5">
            {searches.map((s) => (
              <div
                key={s.id}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50 shadow-sm'
                }`}
                onClick={() => onSelectSearch(s)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Tag color="blue" className="font-mono font-bold m-0">{s.origin}</Tag>
                    <ArrowLeftOutlined className="text-xs text-slate-400" />
                    <Tag color="green" className="font-mono font-bold m-0">{s.destination}</Tag>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {s.createdAt ? dayjs(s.createdAt).format('HH:mm:ss - YYYY/MM/DD') : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>تاریخ پرواز: <b className={`font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{s.departureDate}</b></span>
                  <span>آفرهای استخراج‌شده: <b className="text-blue-500">{s.offersCount || 0}</b></span>
                </div>

                {s.minPrice && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/40 text-xs text-emerald-500 font-semibold flex items-center justify-between">
                    <span>کمترین نرخ کشف‌شده:</span>
                    <span className="font-bold">{formatToman(s.minPrice)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};
