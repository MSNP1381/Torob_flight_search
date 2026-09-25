import React from 'react';
import { Card, Row, Col, Select, Button, DatePicker, Checkbox, Space, Tag } from 'antd';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  SearchOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { ProviderType } from '../ProviderLogo';
import { AirportOption } from '../../types/flight';

export interface FlightSearchFormProps {
  isDarkMode: boolean;
  origin: AirportOption;
  setOrigin: (opt: AirportOption) => void;
  destination: AirportOption;
  setDestination: (opt: AirportOption) => void;
  depDate: Dayjs;
  setDepDate: (date: Dayjs) => void;
  cabin: string;
  setCabin: (cabin: string) => void;
  selectedProviders: ProviderType[];
  setSelectedProviders: (providers: ProviderType[]) => void;
  originOptions: any[];
  destOptions: any[];
  onSearchAirports: (query: string, isOrigin: boolean) => void;
  onSwap: () => void;
  onSearch: () => void;
  isSearching: boolean;
  onSelectPopularRoute: (from: AirportOption, to: AirportOption) => void;
}

const POPULAR_ROUTES = [
  {
    label: 'تهران ⇄ مشهد',
    from: { code: 'THR', name: 'تهران (مهرآباد)', city: 'تهران' },
    to: { code: 'MHD', name: 'مشهد (هاشمی‌نژاد)', city: 'مشهد' },
  },
  {
    label: 'تهران ⇄ کیش',
    from: { code: 'THR', name: 'تهران (مهرآباد)', city: 'تهران' },
    to: { code: 'KIH', name: 'کیش (فرودگاه کیش)', city: 'کیش' },
  },
  {
    label: 'تهران ⇄ شیراز',
    from: { code: 'THR', name: 'تهران (مهرآباد)', city: 'تهران' },
    to: { code: 'SYZ', name: 'شیراز (دستغیب)', city: 'شیراز' },
  },
  {
    label: 'تهران ⇄ استانبول',
    from: { code: 'IKA', name: 'تهران (امام خمینی)', city: 'تهران' },
    to: { code: 'IST', name: 'استانبول (IST)', city: 'استانبول' },
  },
];

const DEFAULT_AIRPORTS = [
  { value: 'THR', label: 'تهران (THR - فرودگاه مهرآباد)', raw: { iata: 'THR', name: 'تهران', countryName: 'ایران' } },
  { value: 'IKA', label: 'تهران (IKA - فرودگاه امام خمینی)', raw: { iata: 'IKA', name: 'تهران', countryName: 'ایران' } },
  { value: 'MHD', label: 'مشهد (MHD - شهید هاشمی‌نژاد)', raw: { iata: 'MHD', name: 'مشهد', countryName: 'ایران' } },
  { value: 'SYZ', label: 'شیراز (SYZ - شهید دستغیب)', raw: { iata: 'SYZ', name: 'شیراز', countryName: 'ایران' } },
  { value: 'ISF', label: 'اصفهان (IFN - شهید بهشتی)', raw: { iata: 'IFN', name: 'اصفهان', countryName: 'ایران' } },
  { value: 'TBZ', label: 'تبریز (TBZ - شهید مدنی)', raw: { iata: 'TBZ', name: 'تبریز', countryName: 'ایران' } },
  { value: 'KIH', label: 'کیش (KIH - فرودگاه کیش)', raw: { iata: 'KIH', name: 'کیش', countryName: 'ایران' } },
  { value: 'IST', label: 'استانبول (IST - Istanbul Airport)', raw: { iata: 'IST', name: 'استانبول', countryName: 'ترکیه' } },
  { value: 'DXB', label: 'دبی (DXB - Dubai International)', raw: { iata: 'DXB', name: 'دبی', countryName: 'امارات' } },
];

export const FlightSearchForm: React.FC<FlightSearchFormProps> = ({
  isDarkMode,
  origin,
  setOrigin,
  destination,
  setDestination,
  depDate,
  setDepDate,
  cabin,
  setCabin,
  selectedProviders,
  setSelectedProviders,
  originOptions,
  destOptions,
  onSearchAirports,
  onSwap,
  onSearch,
  isSearching,
  onSelectPopularRoute,
}) => {
  return (
    <Card
      className={`transition-all duration-200 border rounded-2xl shadow-lg ${
        isDarkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'
      }`}
      styles={{ body: { padding: '24px' } }}
    >
      {/* Top row: Title, Popular routes, and Provider checkboxes */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5 pb-4 border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl flex-shrink-0">
            <SearchOutlined className="text-lg" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold m-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              جستجوی جامع پرواز و مقایسه نرخ تامین‌کنندگان
            </h2>
            <p className={`text-xs m-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              ادغام و حذف رکوردهای تکراری از علی‌بابا، فلای‌تودی و سفرمارکت
            </p>
          </div>
        </div>

        {/* Provider selection tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            کراولرهای فعال:
          </span>
          <Checkbox.Group
            value={selectedProviders}
            onChange={(checkedValues) => {
              if (checkedValues.length > 0) {
                setSelectedProviders(checkedValues as ProviderType[]);
              }
            }}
          >
            <Space size="middle">
              <Checkbox value="alibaba">
                <span className="text-amber-500 font-bold text-xs">علی‌بابا</span>
              </Checkbox>
              <Checkbox value="flytoday">
                <span className="text-sky-500 font-bold text-xs">فلای‌تودی</span>
              </Checkbox>
              <Checkbox value="safarmarket">
                <span className="text-emerald-500 font-bold text-xs">سفرمارکت</span>
              </Checkbox>
            </Space>
          </Checkbox.Group>
        </div>
      </div>

      {/* Popular Route Shortcuts */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <span className={`text-[11px] font-bold flex items-center gap-1 flex-shrink-0 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <FireOutlined className="text-amber-500" />
          مسیرهای پرتردد:
        </span>
        {POPULAR_ROUTES.map((route, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPopularRoute(route.from, route.to)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex-shrink-0 border ${
              origin.code === route.from.code && destination.code === route.to.code
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : isDarkMode
                ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {route.label}
          </button>
        ))}
      </div>

      {/* Main Search Inputs Grid */}
      <Row gutter={[14, 14]} align="bottom">
        {/* Origin */}
        <Col xs={24} md={7}>
          <label
            className={`block text-xs font-bold mb-1.5 flex items-center justify-between ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <EnvironmentOutlined className="text-blue-500" /> مبدا حرکت (Origin)
            </span>
            <span className="text-[11px] font-mono text-blue-500 font-bold">{origin.code}</span>
          </label>
          <Select
            showSearch
            size="large"
            className="w-full"
            placeholder="جستجوی شهر یا کد فرودگاه (تهران, مشهد, SYZ, ...)"
            value={origin.code}
            onSearch={(val) => onSearchAirports(val, true)}
            onSelect={(val, option: any) => {
              const raw = option.raw;
              if (raw) {
                setOrigin({
                  code: raw.iata,
                  name: `${raw.name} (${raw.countryName})`,
                  city: raw.name,
                });
              }
            }}
            filterOption={false}
            options={originOptions.length > 0 ? originOptions : DEFAULT_AIRPORTS}
          />
        </Col>

        {/* Swap Button */}
        <Col xs={24} md={2} className="flex justify-center pb-1">
          <Button
            size="large"
            icon={<SwapOutlined />}
            onClick={onSwap}
            className="rounded-xl w-full md:w-auto hover:rotate-180 transition-transform duration-300"
            title="جابجایی مبدا و مقصد"
          />
        </Col>

        {/* Destination */}
        <Col xs={24} md={7}>
          <label
            className={`block text-xs font-bold mb-1.5 flex items-center justify-between ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <EnvironmentOutlined className="text-emerald-500" /> مقصد سفر (Destination)
            </span>
            <span className="text-[11px] font-mono text-emerald-500 font-bold">{destination.code}</span>
          </label>
          <Select
            showSearch
            size="large"
            className="w-full"
            placeholder="جستجوی شهر یا کد فرودگاه (مشهد, شیراز, کیش, ...)"
            value={destination.code}
            onSearch={(val) => onSearchAirports(val, false)}
            onSelect={(val, option: any) => {
              const raw = option.raw;
              if (raw) {
                setDestination({
                  code: raw.iata,
                  name: `${raw.name} (${raw.countryName})`,
                  city: raw.name,
                });
              }
            }}
            filterOption={false}
            options={destOptions.length > 0 ? destOptions : DEFAULT_AIRPORTS}
          />
        </Col>

        {/* Departure Date */}
        <Col xs={24} md={5}>
          <label
            className={`block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <ClockCircleOutlined className="text-amber-500" /> تاریخ پرواز (Date)
          </label>
          <DatePicker
            size="large"
            className="w-full"
            value={depDate}
            minDate={dayjs().startOf('day')}
            disabledDate={(current) => !!current && current < dayjs().startOf('day')}
            allowClear={false}
            onChange={(date) => {
              if (date) setDepDate(date);
            }}
          />
        </Col>

        {/* Search Button */}
        <Col xs={24} md={3}>
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={isSearching}
            onClick={onSearch}
            className="w-full font-black text-sm rounded-xl h-[40px] shadow-lg shadow-blue-600/30"
          >
            جستجو
          </Button>
        </Col>
      </Row>
    </Card>
  );
};
