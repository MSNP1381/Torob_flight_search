import React, { useMemo } from 'react';
import { Card, Tag, Button, Tooltip as AntTooltip } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

export interface HistogramBin {
  key: string;
  minMinutes: number;
  maxMinutes: number;
  label: string;
  shortLabel: string;
  count: number;
  minPrice: number;
  airlines: string[];
  isFastest: boolean;
}

export interface DurationHistogramProps {
  flights: Array<{
    id: string;
    durationMinutes: number;
    duration: string;
    bestPrice: {
      totalPrice: number;
    };
    airline: {
      name: string;
      nameFa?: string;
    };
  }>;
  selectedBinKey: string | null;
  onSelectBin: (binKey: string | null, minMinutes?: number, maxMinutes?: number) => void;
}

export const DurationHistogram: React.FC<DurationHistogramProps> = ({
  flights,
  selectedBinKey,
  onSelectBin,
}) => {
  const { bins, fastestBin, avgDuration } = useMemo(() => {
    if (!flights || flights.length === 0) {
      return { bins: [], fastestBin: null, minDuration: 0, maxDuration: 0, avgDuration: 0 };
    }

    const durations = flights.map((f) => f.durationMinutes || 60);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const avg = Math.round(sum / durations.length);

    // If all flights have identical duration
    if (min === max) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const singleBin: HistogramBin = {
        key: `bin-${min}`,
        minMinutes: min,
        maxMinutes: max,
        label: `${h > 0 ? `${h} ساعت ` : ''}${m} دقیقه`,
        shortLabel: `${h > 0 ? `${h}h ` : ''}${m}m`,
        count: flights.length,
        minPrice: Math.min(...flights.map((f) => f.bestPrice.totalPrice)),
        airlines: Array.from(new Set(flights.map((f) => f.airline.nameFa || f.airline.name))),
        isFastest: true,
      };
      return {
        bins: [singleBin],
        fastestBin: singleBin,
        minDuration: min,
        maxDuration: max,
        avgDuration: avg,
      };
    }

    // Number of bins (between 4 and 6 depending on range)
    const range = max - min;
    const binCount = range > 60 ? 6 : range > 30 ? 5 : 4;
    const step = Math.max(5, Math.ceil(range / binCount));

    const generatedBins: HistogramBin[] = [];
    let currentMin = min;

    for (let i = 0; i < binCount; i++) {
      const currentMax = i === binCount - 1 ? max : currentMin + step - 1;
      const binFlights = flights.filter(
        (f) => (f.durationMinutes || 60) >= currentMin && (f.durationMinutes || 60) <= currentMax
      );

      const minH = Math.floor(currentMin / 60);
      const minM = currentMin % 60;
      const maxH = Math.floor(currentMax / 60);
      const maxM = currentMax % 60;

      const formatPart = (h: number, m: number) => {
        if (h === 0) return `${m}د`;
        if (m === 0) return `${h}س`;
        return `${h}:${m < 10 ? '0' : ''}${m}`;
      };

      const shortLabel = `${formatPart(minH, minM)}-${formatPart(maxH, maxM)}`;
      const label = `${formatPart(minH, minM)} تا ${formatPart(maxH, maxM)}`;

      const minPrice = binFlights.length > 0
        ? Math.min(...binFlights.map((f) => f.bestPrice.totalPrice))
        : 0;

      const airlines = Array.from(
        new Set(binFlights.map((f) => f.airline.nameFa || f.airline.name))
      );

      generatedBins.push({
        key: `bin-${currentMin}-${currentMax}`,
        minMinutes: currentMin,
        maxMinutes: currentMax,
        label,
        shortLabel,
        count: binFlights.length,
        minPrice,
        airlines,
        isFastest: i === 0,
      });

      currentMin = currentMax + 1;
      if (currentMin > max) break;
    }

    // Identify fastest bin with at least 1 flight
    const nonZeroFastest = generatedBins.find((b) => b.count > 0 && b.isFastest) ||
      generatedBins.find((b) => b.count > 0);

    return {
      bins: generatedBins,
      fastestBin: nonZeroFastest || null,
      minDuration: min,
      maxDuration: max,
      avgDuration: avg,
    };
  }, [flights]);

  if (!flights || flights.length === 0) {
    return null;
  }

  const formatToman = (amount: number) => {
    return `${Math.round(amount / 10).toLocaleString('fa-IR')} تومان`;
  };

  const formatHoursMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} دقیقه`;
    if (m === 0) return `${h} ساعت`;
    return `${h}س و ${m}د`;
  };

  return (
    <Card
      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl mb-5 shadow-md overflow-hidden transition-colors"
      styles={{ body: { padding: '16px' } }}
    >
      {/* Responsive Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-base flex-shrink-0">
            <ThunderboltOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                توزیع مدت زمان پروازها
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                (مدت سفر)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
              کلیک روی هر ستون برای فیلتر پروازهای آن بازه
            </p>
          </div>
        </div>

        {/* Stats summary & Quick filter badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {fastestBin && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px]">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircleOutlined />
                سریع‌ترین:
              </span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">{fastestBin.shortLabel}</span>
              <span className="text-emerald-600 dark:text-emerald-300 font-mono">
                ({formatToman(fastestBin.minPrice)})
              </span>
            </div>
          )}

          <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/40 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
            <ClockCircleOutlined className="text-blue-500 dark:text-blue-400" />
            <span>میانگین: {formatHoursMinutes(avgDuration)}</span>
          </div>

          {selectedBinKey && (
            <Button
              size="small"
              type="primary"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => onSelectBin(null)}
              className="text-xs rounded-lg h-7"
            >
              نمایش همه
            </Button>
          )}
        </div>
      </div>

      {/* Recharts Bar Chart - compact & fully responsive */}
      <div className="h-36 sm:h-40 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={bins}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedBin = state.activePayload[0].payload as HistogramBin;
                if (clickedBin.count > 0) {
                  if (selectedBinKey === clickedBin.key) {
                    onSelectBin(null);
                  } else {
                    onSelectBin(clickedBin.key, clickedBin.minMinutes, clickedBin.maxMinutes);
                  }
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#94a3b844' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              allowDecimals={false}
              tickLine={false}
              axisLine={{ stroke: '#94a3b844' }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HistogramBin;
                  return (
                    <div
                      className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl text-right font-sans text-xs text-slate-800 dark:text-slate-200 min-w-48"
                      dir="rtl"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          بازه {data.label}
                        </span>
                        {data.isFastest && (
                          <Tag color="success" className="m-0 text-[10px] font-bold">
                            سریع‌ترین
                          </Tag>
                        )}
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">تعداد پرواز:</span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{data.count}</span>
                        </div>
                        {data.count > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">شروع قیمت:</span>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                              {formatToman(data.minPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {bins.map((bin) => {
                const isSelected = selectedBinKey === bin.key;
                let fill = '#3b82f6';
                if (bin.isFastest) fill = '#10b981';
                if (isSelected) fill = '#f59e0b';
                if (bin.count === 0) fill = '#94a3b833';
                return (
                  <Cell
                    key={bin.key}
                    fill={fill}
                    className="cursor-pointer transition duration-150"
                    stroke={isSelected ? '#fbbf24' : bin.isFastest ? '#34d399' : 'none'}
                    strokeWidth={isSelected ? 2 : bin.isFastest ? 1 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & quick indicators */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
          <span className="text-emerald-700 dark:text-emerald-300 font-medium">سریع‌ترین بازه</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span>
          <span>سایر زمان‌ها</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
          <span>فیلتر فعال</span>
        </span>
      </div>
    </Card>
  );
};
