import React from 'react';
import { Card, Row, Col, Input, Select, Button } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { SandboxFormData, SandboxResultData } from '../../types/flight';

export interface KeySandboxTabProps {
  isDarkMode: boolean;
  form: SandboxFormData;
  setForm: (form: SandboxFormData) => void;
  result: SandboxResultData | null;
  onCalculate: () => void;
}

export const KeySandboxTab: React.FC<KeySandboxTabProps> = ({
  isDarkMode,
  form,
  setForm,
  result,
  onCalculate,
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
          className={`pb-4 mb-5 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <h2 className={`text-base font-extrabold m-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            آزمایشگاه تولید کلید تجمیع پرواز (Deterministic Grouping Key Lab)
          </h2>
          <p className={`text-xs m-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            فرمول رسمی استاندارد BuyO برای شناسایی پروازهای فیزیکی یکسان از کراولرهای مختلف
          </p>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={4}>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              کد ایرلاین (IATA)
            </label>
            <Input
              value={form.airlineCode}
              onChange={(e) => setForm({ ...form, airlineCode: e.target.value.toUpperCase() })}
              className="font-mono uppercase"
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              شماره پرواز
            </label>
            <Input
              value={form.flightNumber}
              onChange={(e) => setForm({ ...form, flightNumber: e.target.value.toUpperCase() })}
              className="font-mono uppercase"
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              مبدا (IATA)
            </label>
            <Input
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value.toUpperCase() })}
              className="font-mono uppercase"
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              مقصد (IATA)
            </label>
            <Input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value.toUpperCase() })}
              className="font-mono uppercase"
            />
          </Col>
          <Col xs={24} md={5}>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              زمان حرکت (ISO)
            </label>
            <Input
              value={form.departureAt}
              onChange={(e) => setForm({ ...form, departureAt: e.target.value })}
              className="font-mono"
            />
          </Col>
          <Col xs={24} md={3}>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              کلاس پروازی
            </label>
            <Select
              className="w-full"
              value={form.cabin}
              onChange={(val) => setForm({ ...form, cabin: val })}
              options={[
                { value: 'economy', label: 'economy' },
                { value: 'business', label: 'business' },
                { value: 'first', label: 'first' },
              ]}
            />
          </Col>
        </Row>

        <div className="mt-4">
          <Button
            type="primary"
            icon={<CodeOutlined />}
            onClick={onCalculate}
            className="font-bold text-xs rounded-xl"
          >
            محاسبه کلید یکپارچه
          </Button>
        </div>

        {result && (
          <div
            className={`mt-5 pt-4 border-t space-y-4 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                کلید یکپارچه‌سازی متنی (Canonical Key):
              </span>
              <pre
                className={`mt-1 p-3 rounded-xl border text-xs font-mono break-all select-all ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800 text-emerald-400'
                    : 'bg-slate-100 border-slate-300 text-emerald-700'
                }`}
              >
                {result.groupingKey}
              </pre>
            </div>

            <div>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                شناسه قطعی پرواز (SHA-256 Flight Hash):
              </span>
              <pre
                className={`mt-1 p-3 rounded-xl border text-xs font-mono select-all ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800 text-amber-300'
                    : 'bg-slate-100 border-slate-300 text-amber-700'
                }`}
              >
                {result.flightHash}
              </pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
