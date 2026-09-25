import React from 'react';
import { Drawer } from 'antd';
import { SlidersOutlined } from '@ant-design/icons';
import { PresetProfileName } from '../../algo';

export interface WeightMatrixDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAlgoProfile: PresetProfileName;
  familyAdultsCount: number;
  familyKidsCount: number;
  currentWeightMatrix: {
    price: number;
    duration: number;
    stops: number;
    timeOfDay: number;
    baggage: number;
    systemic: number;
    airlineClass: number;
    providerCompetition: number;
    toVector: () => number[];
  };
}

export const WeightMatrixDrawer: React.FC<WeightMatrixDrawerProps> = ({
  isOpen,
  onClose,
  selectedAlgoProfile,
  familyAdultsCount,
  familyKidsCount,
  currentWeightMatrix,
}) => {
  const items = [
    { label: '💰 قیمت تمام‌شده (دلتای معکوس به ارزان‌ترین)', val: currentWeightMatrix.price, desc: 'هرچه ارزان‌تر، امتیاز بالاتر' },
    { label: '⚡ مدت زمان پرواز (دلتای معکوس)', val: currentWeightMatrix.duration, desc: 'جریمه زمان طولانی نسبت به سریع‌ترین' },
    { label: '🛑 تعداد توقف‌ها (جریمه ترانزیت)', val: currentWeightMatrix.stops, desc: 'پروازهای مستقیم بالاترین امتیاز را دارند' },
    { label: '🌅 ساعت حرکت (سیرکادین)', val: currentWeightMatrix.timeOfDay, desc: 'ساعات روزانه ۸ تا ۲۰ بیشترین و بامداد کمترین' },
    { label: '🧳 بار مجاز همراه', val: currentWeightMatrix.baggage, desc: 'امتیاز نسبی به بیشترین بار ثبت‌شده' },
    { label: '📋 سیستمی در برابر چارتر', val: currentWeightMatrix.systemic, desc: 'اطمینان استرداد و پایداری بلیت سیستمی' },
    { label: '✈️ کلاس و کیفیت ایرلاین', val: currentWeightMatrix.airlineClass, desc: 'ارزیابی کیفیت خدمات ناوگان هواپیمایی' },
    { label: '🏪 رقابت تامین‌کنندگان (ترب)', val: currentWeightMatrix.providerCompetition, desc: 'تعداد ارائه‌دهندگان مدعی نرخ رقابتی' },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <SlidersOutlined className="text-rose-500" />
          <span>ماتریس وزن‌های الگوریتم رتبه‌بندی (بردار W)</span>
        </div>
      }
      placement="left"
      onClose={onClose}
      open={isOpen}
      width={460}
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 space-y-1.5">
          <div className="font-bold text-blue-900 dark:text-blue-300">
            فرمولاسیون ضرب ماتریسی (S = X · W):
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] leading-relaxed">
            ماتریس وضعیت پروازها X به ابعاد (N × 8) در بردار وزن‌های W به ابعاد (8 × 1) ضرب گردیده و نمره هر کارت با کلید hash_id ذخیره می‌شود.
          </p>
        </div>

        <div className="font-bold text-slate-800 dark:text-slate-200">
          وزن‌های فعال برای پروفایل: <span className="text-rose-600 dark:text-rose-400">
            {selectedAlgoProfile === 'bestDeal' && 'پیشنهاد برتر (متعادل)'}
            {selectedAlgoProfile === 'business' && 'کاری و بیزنس'}
            {selectedAlgoProfile === 'student' && 'دانشجویی و اقتصادی'}
            {selectedAlgoProfile === 'family' && `خانوادگی (${familyAdultsCount} بزرگسال، ${familyKidsCount} کودک)`}
            {selectedAlgoProfile === 'fastest' && 'سریع‌ترین مسیر'}
          </span>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 dark:text-slate-200">{item.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</div>
              </div>
              <div className="text-right flex-shrink-0 mr-2">
                <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                  {(item.val * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] break-all">
          <div className="font-bold text-slate-600 dark:text-slate-400 mb-1">
            بردار وزن W (مجموع = ۱.۰۰):
          </div>
          [{currentWeightMatrix.toVector().map((v) => v.toFixed(3)).join(', ')}]
        </div>
      </div>
    </Drawer>
  );
};
