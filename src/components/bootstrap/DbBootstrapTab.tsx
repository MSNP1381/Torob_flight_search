import React from 'react';
import { Card, Row, Col, Statistic, Button, Alert } from 'antd';
import {
  DatabaseOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
  RocketOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { DbStatusData } from '../../types/flight';
import { BootstrapLogs } from '../../hooks/useDbBootstrap';

export interface DbBootstrapTabProps {
  isDarkMode: boolean;
  dbStatus: DbStatusData | null;
  isBootstrapping: boolean;
  bootstrapLogs: BootstrapLogs | null;
  onRunBootstrap: () => void;
}

export const DbBootstrapTab: React.FC<DbBootstrapTabProps> = ({
  isDarkMode,
  dbStatus,
  isBootstrapping,
  bootstrapLogs,
  onRunBootstrap,
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
          className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl">
              <DatabaseOutlined className="text-xl" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold m-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                راه‌اندازی دیتابیس و تزریق داده‌های مرجع (Reference Data Seed)
              </h2>
              <p className={`text-xs m-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ایجاد جداول ساختار داده و سیدینگ فرودگاه‌ها و خطوط هوایی بر اساس سند{' '}
                <code>docs/LOCAL_ENV_BOOTSTRAP.md</code>
              </p>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            loading={isBootstrapping}
            onClick={onRunBootstrap}
            className="font-bold text-xs bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30"
          >
            اجرای راه‌اندازی و سید دیتابیس
          </Button>
        </div>

        {/* Database Metrics Grid */}
        <Row gutter={[16, 16]} className="my-5">
          <Col xs={24} sm={12} lg={6}>
            <Card
              className={`rounded-xl border transition-colors ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Statistic
                title={<span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>فرودگاه‌ها (static_data)</span>}
                value={dbStatus?.airports_raw_count || 6778}
                prefix={<GlobalOutlined className="text-blue-500 ml-2" />}
                valueStyle={{ color: isDarkMode ? '#fff' : '#0f172a', fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>از فایل misc/airports.json</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className={`rounded-xl border transition-colors ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Statistic
                title={<span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ایرلاین‌های مرجع (airlines)</span>}
                value={dbStatus?.airlines_raw_count || 100}
                prefix={<RocketOutlined className="text-amber-500 ml-2" />}
                valueStyle={{ color: isDarkMode ? '#fff' : '#0f172a', fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>از فایل misc/airlines_complete.json</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className={`rounded-xl border transition-colors ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Statistic
                title={<span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>کراولرهای متصل</span>}
                value={3}
                prefix={<ApartmentOutlined className="text-emerald-500 ml-2" />}
                valueStyle={{ color: isDarkMode ? '#fff' : '#0f172a', fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Alibaba, FlyToday, SafarMarket</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className={`rounded-xl border transition-colors ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Statistic
                title={<span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>موتور پایگاه داده</span>}
                value="buyo.sqlite"
                prefix={<DatabaseOutlined className="text-indigo-500 ml-2" />}
                valueStyle={{ color: isDarkMode ? '#fff' : '#0f172a', fontFamily: 'monospace', fontSize: '18px' }}
              />
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircleOutlined /> آماده و متصل
              </div>
            </Card>
          </Col>
        </Row>

        {/* Live Console Output */}
        {bootstrapLogs && (
          <div className="mt-5 space-y-3">
            <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <CodeOutlined className="text-emerald-500" />
              <span>خروجی ترمینال اجرای اسکریپت‌های پایتون:</span>
            </div>

            {bootstrapLogs.error && (
              <Alert type="error" message={bootstrapLogs.error} className="rounded-xl" />
            )}

            {bootstrapLogs.bootstrap && (
              <div>
                <div className={`text-[11px] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>۱. خروجی ایجاد اسکیمای جداول:</div>
                <pre
                  className={`p-3 border rounded-xl text-xs font-mono whitespace-pre-wrap ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800 text-emerald-400'
                      : 'bg-slate-100 border-slate-300 text-emerald-700'
                  }`}
                >
                  {bootstrapLogs.bootstrap}
                </pre>
              </div>
            )}

            {bootstrapLogs.seed && (
              <div>
                <div className={`text-[11px] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>۲. خروجی سیدینگ داده‌های مرجع:</div>
                <pre
                  className={`p-3 border rounded-xl text-xs font-mono whitespace-pre-wrap ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800 text-sky-300'
                      : 'bg-slate-100 border-slate-300 text-sky-700'
                  }`}
                >
                  {bootstrapLogs.seed}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
