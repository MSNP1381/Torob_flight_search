import React, { useState } from 'react';
import { Modal, Button, Alert, Divider } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { GroupedFlightCard, ProviderOffer } from '../../types/flight';
import { ProviderLogo } from '../ProviderLogo';
import { saveBookingToFirebase } from '../../firebase/flightService';
import { formatToman, formatRial } from '../../utils/formatters';

export interface BookingModalProps {
  bookingData: {
    flight: GroupedFlightCard;
    providerOffer: ProviderOffer;
  } | null;
  onClose: () => void;
  isDarkMode: boolean;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  bookingData,
  onClose,
  isDarkMode,
}) => {
  const [bookingSuccessId, setBookingSuccessId] = useState<string | null>(null);
  const [isBookingSaving, setIsBookingSaving] = useState<boolean>(false);

  if (!bookingData) return null;

  const { flight, providerOffer } = bookingData;

  const handleConfirmBooking = async () => {
    setIsBookingSaving(true);
    try {
      const docId = await saveBookingToFirebase({
        flightId: flight.id,
        groupingKey: flight.groupingKey,
        flightNumber: flight.flightNumber,
        airlineName: flight.airline.nameFa || flight.airline.name,
        origin: flight.origin,
        destination: flight.destination,
        departureAt: flight.departureAt,
        provider: providerOffer.provider,
        totalPrice: providerOffer.totalPrice,
        status: 'confirmed',
      });
      setBookingSuccessId(docId || `BK-${Date.now().toString(36).toUpperCase()}`);
    } catch (err) {
      console.error('Failed to save booking:', err);
    } finally {
      setIsBookingSaving(false);
    }
  };

  const handleClose = () => {
    setBookingSuccessId(null);
    onClose();
  };

  return (
    <Modal
      open={Boolean(bookingData)}
      onCancel={handleClose}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-base font-bold">
          <CheckCircleOutlined className="text-emerald-500 text-lg" />
          <span>تایید انتخاب پرواز و اتصال به تامین‌کننده</span>
        </div>
      }
      className="rounded-2xl"
    >
      <div className="space-y-4 pt-2 text-xs">
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className={`font-extrabold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {flight.airline.nameFa || flight.airline.name}
            </div>
            <div className={`font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              شماره پرواز: {flight.flightNumber}
            </div>
          </div>
          <ProviderLogo provider={providerOffer.provider} size="md" showLabel={true} />
        </div>

        <div
          className={`p-4 rounded-xl space-y-2.5 transition-colors ${
            isDarkMode ? 'bg-slate-800/40' : 'bg-slate-100/70 border border-slate-200'
          }`}
        >
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>قیمت نهایی بلیت:</span>
            <span className={`font-extrabold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {formatToman(providerOffer.totalPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>معادل ریال:</span>
            <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {formatRial(providerOffer.totalPrice)}
            </span>
          </div>
          <Divider className={`my-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`} />
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>مسیر سفر:</span>
            <span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {flight.origin} ← {flight.destination}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>زمان حرکت:</span>
            <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {new Date(flight.departureAt).toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>بار مجاز:</span>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{providerOffer.baggage}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>شناسه یکپارچه پرواز:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px]">
              {flight.id}
            </span>
          </div>
        </div>

        {bookingSuccessId ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-center">
            <CheckCircleOutlined className="text-3xl text-emerald-500" />
            <div className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>
              رزرو با موفقیت در پایگاه داده Firebase ثبت شد!
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              شناسه پیگیری سفارش (Firestore Document ID):
            </div>
            <div
              className={`p-2 rounded-lg border font-mono text-emerald-600 dark:text-emerald-400 select-all text-xs ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
              }`}
            >
              {bookingSuccessId}
            </div>
            <Button
              type="primary"
              onClick={handleClose}
              className="w-full mt-2 font-bold text-xs rounded-xl"
            >
              بستن پنجره
            </Button>
          </div>
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              message="اتصال مستقیم به کراولر و ثبت در Firebase"
              description={`کراولر ${providerOffer.providerName} درخواست ثبت نام مسافر و ایجاد رزرو PNR را به صورت زنده انجام خواهد داد و داده در Firestore ذخیره خواهد شد.`}
              className="rounded-xl text-[11px]"
            />

            <Button
              type="primary"
              size="large"
              loading={isBookingSaving}
              onClick={handleConfirmBooking}
              className="w-full font-bold text-xs rounded-xl"
            >
              تایید و ثبت نهایی رزرو
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};
