import React, { useState } from 'react';
import { Card, Tag, Button } from 'antd';
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  KeyOutlined,
  DownOutlined,
  UpOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { ProviderLogo } from './ProviderLogo';

export interface FlightCardItemProps {
  card: {
    id: string;
    groupingKey: string;
    flightNumber: string;
    airline: {
      iata: string;
      name: string;
      nameFa?: string;
    };
    origin: string;
    originName?: string;
    destination: string;
    destinationName?: string;
    departureAt: string;
    arrivalAt: string;
    duration: string;
    durationMinutes: number;
    cabin: string;
    isDomestic: boolean;
    stops: number;
    stopInfo?: string;
    transitCity?: string;
    transitInfo?: string;
    layoverDuration?: string;
    providerCount: number;
    providers: Array<{
      provider: string;
      providerName: string;
      totalPrice: number;
      seatsRemaining: number;
      baggage: string;
      cancellationPolicy: string;
    }>;
    bestPrice: {
      provider: string;
      providerName: string;
      totalPrice: number;
    };
    savings: number;
  };
  isCheapest: boolean;
  isFastest: boolean;
  isEarliest: boolean;
  onInspectKey: (card: any) => void;
  onSelectBooking: (card: any, offer: any) => void;
  formatToman: (amount: number) => string;
  formatRial: (amount: number) => string;
}

export const FlightCardItem: React.FC<FlightCardItemProps> = ({
  card,
  isCheapest,
  isFastest,
  isEarliest,
  onInspectKey,
  onSelectBooking,
  formatToman,
  formatRial,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const isMultiProvider = card.providerCount > 1;

  // Format Persian departure/arrival times
  const depTime = new Date(card.departureAt).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const arrTime = new Date(card.arrivalAt).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card
      className={`rounded-2xl transition-all duration-200 border shadow-md overflow-hidden ${
        isMultiProvider
          ? 'border-indigo-200/80 dark:border-slate-800 bg-white dark:bg-[#111927] hover:border-indigo-400 dark:hover:border-slate-700'
          : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] hover:border-slate-300 dark:hover:border-slate-700'
      }`}
      styles={{ body: { padding: '0' } }}
    >
      {/* 1. Header Bar: Providers on right, Grouping Key ID on left */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Right side (RTL): Multi-provider availability */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {card.providers.map((p) => (
              <ProviderLogo
                key={p.provider}
                provider={p.provider}
                size="xs"
                compact={false}
              />
            ))}
          </div>

          {isMultiProvider && (
            <span className="hidden sm:inline-flex text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold items-center gap-1">
              <CheckCircleOutlined />
              تجمیع شده ({card.providerCount} منبع)
            </span>
          )}

          {/* Quick highlight tags */}
          {isCheapest && (
            <Tag color="gold" className="m-0 text-[10px] font-bold">
              <DollarOutlined /> ارزان‌ترین
            </Tag>
          )}
          {isFastest && (
            <Tag color="cyan" className="m-0 text-[10px] font-bold">
              <ThunderboltOutlined /> سریع‌ترین
            </Tag>
          )}
          {isEarliest && (
            <Tag color="purple" className="m-0 text-[10px] font-bold">
              <ClockCircleOutlined /> زودترین
            </Tag>
          )}
        </div>

        {/* Left side (RTL): Grouping Key trigger */}
        <button
          onClick={() => onInspectKey(card)}
          className="flex-shrink-0 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
          title="مشاهده ساختار کلید یکپارچه‌سازی و هش پرواز"
        >
          <KeyOutlined className="text-amber-500 dark:text-amber-400 text-xs" />
          <span className="hidden xs:inline">کلید:</span>
          <span>{card.id.slice(0, 8)}</span>
        </button>
      </div>

      {/* 2. Main Card Body */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* A. Airline Brand info (col 3) */}
          <div className="lg:col-span-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-400 shadow-sm flex-shrink-0">
              {card.airline.iata}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                {card.airline.nameFa || card.airline.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{card.flightNumber}</span>
                <span>·</span>
                <span className="capitalize">{card.cabin}</span>
                <span>·</span>
                <span className={card.isDomestic ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}>
                  {card.isDomestic ? 'داخلی' : 'بین‌المللی'}
                </span>
                {card.transitCity && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      ترانزیت {card.transitCity}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* B. Flight Journey Path (col 5) */}
          <div className="lg:col-span-5 px-1 sm:px-2">
            <div className="flex items-center justify-between">
              {/* Departure */}
              <div className="text-center w-16 flex-shrink-0">
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                  {depTime}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
                  {card.originName || card.origin}
                </div>
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{card.origin}</div>
              </div>

              {/* Journey Path line */}
              <div className="flex-1 px-3 flex flex-col items-center">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono mb-1">
                  <ClockCircleOutlined className="text-slate-400 dark:text-slate-500 text-[10px]" />
                  <span>{card.duration}</span>
                </div>
                <div className="w-full flex items-center relative">
                  <div className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-700"></div>
                  {card.stops > 0 ? (
                    <div className="flex items-center px-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-400/30" title={card.stopInfo || 'توقف ترانزیت'}></span>
                      <SendOutlined className="text-amber-500 dark:text-amber-400 mx-1 text-xs transform -rotate-45" />
                    </div>
                  ) : (
                    <SendOutlined className="text-emerald-500 dark:text-emerald-400 mx-1.5 text-xs transform -rotate-45" />
                  )}
                  <div className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div
                  className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                    card.stops === 0
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40'
                      : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/50'
                  }`}
                >
                  {card.stops === 0 ? 'مستقیم' : (card.stopInfo || `${card.stops} توقف`)}
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center w-16 flex-shrink-0">
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                  {arrTime}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
                  {card.destinationName || card.destination}
                </div>
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{card.destination}</div>
              </div>
            </div>
          </div>

          {/* C. Pricing & Booking Action (col 4) */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
            {/* Price section */}
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>بهترین نرخ از:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{card.bestPrice.providerName}</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {formatToman(card.bestPrice.totalPrice)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {formatRial(card.bestPrice.totalPrice)}
              </div>
              {card.savings > 0 && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  صرفه‌جویی {formatToman(card.savings)}
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="flex flex-col gap-1.5 w-auto sm:w-36">
              <Button
                type="primary"
                size="middle"
                onClick={() =>
                  onSelectBooking(card, card.bestPrice)
                }
                className="font-bold text-xs rounded-xl shadow-md bg-blue-600 hover:bg-blue-500 border-none"
              >
                رزرو در {card.bestPrice.provider.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Multi-Provider Comparison Expander */}
        {isMultiProvider && (
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-medium flex items-center gap-1.5 cursor-pointer transition select-none"
            >
              <span>
                {showComparison
                  ? 'بستن لیست مقایسه قیمت‌ها'
                  : `مشاهده و مقایسه نرخ ${card.providerCount} تامین‌کننده برای این پرواز`}
              </span>
              {showComparison ? <UpOutlined className="text-[10px]" /> : <DownOutlined className="text-[10px]" />}
            </button>

            {showComparison && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
                {card.providers.map((offer) => {
                  const isLowest = offer.provider === card.bestPrice.provider;
                  return (
                    <div
                      key={offer.provider}
                      className={`p-3 rounded-xl border transition ${
                        isLowest
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <ProviderLogo provider={offer.provider} size="sm" showLabel={true} />
                        {isLowest && (
                          <Tag color="green" className="m-0 text-[10px] font-bold">
                            ارزان‌ترین
                          </Tag>
                        )}
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatToman(offer.totalPrice)}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {formatRial(offer.totalPrice)}
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <div>صندلی باقیمانده: {offer.seatsRemaining}</div>
                        <div>بار: {offer.baggage}</div>
                        <div className="truncate">{offer.cancellationPolicy}</div>
                      </div>
                      <Button
                        size="small"
                        className="w-full mt-2 font-bold text-xs rounded-lg"
                        onClick={() => onSelectBooking(card, offer)}
                      >
                        انتخاب این آفر
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
