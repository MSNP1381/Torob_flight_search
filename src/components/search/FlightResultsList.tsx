import React from 'react';
import { Card, Spin } from 'antd';
import { CompassOutlined, LoadingOutlined } from '@ant-design/icons';
import { GroupedFlightCard, ProviderOffer } from '../../types/flight';
import { FlightCardItem } from '../FlightCardItem';
import { formatToman, formatRial } from '../../utils/formatters';

export interface FlightResultsListProps {
  isDarkMode: boolean;
  isSearching: boolean;
  flights: GroupedFlightCard[];
  minPrice: number;
  minDuration: number;
  earliestTime: number;
  algorithmicScores: Record<string, number>;
  isAlgorithmicSort: boolean;
  originCode: string;
  destinationCode: string;
  onInspectKey: (card: GroupedFlightCard) => void;
  onSelectBooking: (flight: GroupedFlightCard, offer: ProviderOffer) => void;
}

export const FlightResultsList: React.FC<FlightResultsListProps> = ({
  isDarkMode,
  isSearching,
  flights,
  minPrice,
  minDuration,
  earliestTime,
  algorithmicScores,
  isAlgorithmicSort,
  originCode,
  destinationCode,
  onInspectKey,
  onSelectBooking,
}) => {
  if (isSearching) {
    return (
      <div
        className={`py-20 text-center space-y-4 rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
        <div className="space-y-1">
          <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            در حال استعلام بلادرنگ و ادغام نتایج پرواز...
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            اتصال به علی‌بابا، فلای‌تودی و سفرمارکت از طریق پروکسی داخلی
          </p>
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <Card
        className={`text-center py-16 rounded-2xl border transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
          <CompassOutlined className="text-3xl" />
        </div>
        <div className={`text-base font-extrabold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          هیچ پروازی برای مسیر {originCode} به {destinationCode} یافت نشد
        </div>
        <p className={`text-xs mt-1.5 max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          لطفاً تاریخ پرواز دیگری را بررسی کنید یا از مسیرهای پرتردد مانند تهران به مشهد یا کیش استفاده نمایید.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3.5">
      {flights.map((card, index) => {
        const isCheapest = card.bestPrice.totalPrice === minPrice;
        const isFastest = card.durationMinutes === minDuration;
        const isEarliest = new Date(card.departureAt).getTime() === earliestTime;
        const score = algorithmicScores[card.id];

        return (
          <FlightCardItem
            key={card.id}
            card={card}
            isCheapest={isCheapest}
            isFastest={isFastest}
            isEarliest={isEarliest}
            algorithmicScore={score}
            algorithmicRank={isAlgorithmicSort ? index + 1 : undefined}
            onInspectKey={onInspectKey}
            onSelectBooking={onSelectBooking}
            formatToman={formatToman}
            formatRial={formatRial}
          />
        );
      })}
    </div>
  );
};
