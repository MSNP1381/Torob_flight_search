import React from 'react';
import { Card, Input, Tag } from 'antd';
import { EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons';
import { AirportCity } from '../../types/flight';

export interface AirportExplorerTabProps {
  isDarkMode: boolean;
  dirQuery: string;
  setDirQuery: (q: string) => void;
  dirResults: AirportCity[];
  isDirLoading: boolean;
  onSearch: (q: string) => void;
}

export const AirportExplorerTab: React.FC<AirportExplorerTabProps> = ({
  isDarkMode,
  dirQuery,
  setDirQuery,
  dirResults,
  isDirLoading,
  onSearch,
}) => {
  return (
    <div className="space-y-6">
      <Card
        className={`transition-colors duration-200 border rounded-2xl shadow-xl ${
          isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
        styles={{ body: { padding: '24px' } }}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            <h2 className={`text-base font-extrabold m-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              بانک فرودگاه‌ها و شهرهای بین‌المللی (۹,۳۲۰ رکورد)
            </h2>
            <p className={`text-xs m-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              جستجوی بلادرنگ با نرمال‌سازی املای فارسی (ی/ي، ک/ك، نیم‌فاصله) و تجمیع فرودگاه‌های یک کلان‌شهر
            </p>
          </div>
          <Tag color="cyan" className="font-mono text-xs px-3 py-1">
            Dataset: misc/airports.json
          </Tag>
        </div>

        <Input.Search
          size="large"
          placeholder="جستجوی نام شهر یا فرودگاه به فارسی یا کد IATA (مثلا: تهران، مشهد، شیراز، استانبول، دبی، THR، IKA، DXB)..."
          value={dirQuery}
          onChange={(e) => setDirQuery(e.target.value)}
          onSearch={(val) => onSearch(val)}
          enterButton="جستجوی فرودگاه"
          loading={isDirLoading}
          className="mb-5"
        />

        <div className="space-y-4">
          {dirResults.map((city) => (
            <Card
              key={city.iata}
              className={`transition-colors border rounded-xl ${
                isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/70'
              }`}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined className="text-blue-500" />
                  <span className={`font-extrabold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {city.name}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    ({city.countryName})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="blue" className="font-mono font-bold text-xs">
                    کد کلان‌شهر: {city.iata}
                  </Tag>
                  <Tag color={city.isDomestic ? 'green' : 'purple'}>
                    {city.isDomestic ? 'پروازهای داخلی' : 'بین‌المللی'}
                  </Tag>
                </div>
              </div>

              {/* Child Airports List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {city.children?.map((child) => (
                  <div
                    key={child.iata}
                    className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {child.name}
                      </div>
                      <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        فرودگاه {child.isDomestic ? 'داخلی' : 'بین‌المللی'}
                      </div>
                    </div>
                    <Tag color="geekblue" className="font-mono font-black text-xs">
                      {child.iata}
                    </Tag>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};
