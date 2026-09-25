import React, { useState, useEffect } from 'react';
import {
  SafetyCertificateOutlined,
  SyncOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  WarningFilled,
  CopyOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  SearchOutlined,
  PlusOutlined,
  ApiOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { ProviderLogo } from './ProviderLogo';

interface ProviderSession {
  site_name: string;
  status: string;
  has_cookies: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  proxy_binding?: string;
}

interface IranProxy {
  url: string;
  ip: string;
  port: number;
  protocol: string;
  provider?: string;
  country: string;
  status: 'active' | 'untested' | 'failed';
  latencyMs?: number;
  lastChecked?: string;
  isCustom?: boolean;
}

export function ProviderSessionManagerModal({
  isOpen,
  onClose,
  isDarkMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'creds' | 'iran_proxy'>('creds');
  const [sessions, setSessions] = useState<ProviderSession[]>([]);
  const [proxies, setProxies] = useState<IranProxy[]>([]);
  const [activeProxy, setActiveProxy] = useState<IranProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingCreds, setRefreshingCreds] = useState(false);
  const [searchingProxies, setSearchingProxies] = useState(false);
  const [testingProxyUrl, setTestingProxyUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncJson, setSyncJson] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [customProxyUrl, setCustomProxyUrl] = useState('');
  const [customProxyName, setCustomProxyName] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/integrations/sessions');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProxies = async () => {
    try {
      const res = await fetch('/api/v1/integrations/proxies');
      const data = await res.json();
      if (data.proxies) {
        setProxies(data.proxies);
        setActiveProxy(data.active_proxy);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      fetchProxies();
    }
  }, [isOpen]);

  // One-click Auto Update Cookies & Credentials (the secret button requested)
  const handleAutoRefreshCreds = async (provider?: string) => {
    setRefreshingCreds(true);
    setSyncStatus('در حال اتصال از طریق پروکسی ایران و نوسازی کوکی‌ها و توکن‌ها...');
    try {
      const res = await fetch('/api/v1/integrations/auto-refresh-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const result = await res.json();
      if (result.success) {
        setSyncStatus(`✅ ${result.message}`);
        await fetchSessions();
      } else {
        setSyncStatus(`❌ خطا: ${result.error || 'بروزرسانی ناموفق بود'}`);
      }
    } catch (err: any) {
      setSyncStatus(`❌ خطای شبکه: ${err.message}`);
    } finally {
      setRefreshingCreds(false);
    }
  };

  // Search and discover fresh Iran proxies
  const handleSearchIranProxies = async () => {
    setSearchingProxies(true);
    try {
      const res = await fetch('/api/v1/integrations/proxies/search', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setSyncStatus(`✅ ${result.message}`);
        if (result.proxies) {
          setProxies(result.proxies);
        }
      }
    } catch (err: any) {
      setSyncStatus(`خطا در جستجوی پروکسی: ${err.message}`);
    } finally {
      setSearchingProxies(false);
    }
  };

  // Add custom Iran proxy
  const handleAddCustomProxy = async () => {
    if (!customProxyUrl.trim()) return;
    try {
      const res = await fetch('/api/v1/integrations/proxies/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: customProxyUrl.trim(),
          provider: customProxyName.trim() || 'پروکسی اختصاصی ایران',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setCustomProxyUrl('');
        setCustomProxyName('');
        setSyncStatus('✅ پروکسی اختصاصی با موفقیت افزوده شد.');
        fetchProxies();
      }
    } catch (err: any) {
      setSyncStatus(`خطا در افزودن پروکسی: ${err.message}`);
    }
  };

  // Test Iran proxy latency and connectivity
  const handleTestProxy = async (url: string) => {
    setTestingProxyUrl(url);
    try {
      const res = await fetch('/api/v1/integrations/proxies/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`✅ ${data.result.message}`);
      } else {
        setSyncStatus(`⚠️ نتیجه تست: ${data.result?.message || 'پاسخی دریافت نشد'}`);
      }
      fetchProxies();
    } catch (err: any) {
      setSyncStatus(`خطا در تست پروکسی: ${err.message}`);
    } finally {
      setTestingProxyUrl(null);
    }
  };

  const handleManualSync = async () => {
    if (!syncJson.trim()) return;
    try {
      const payload = JSON.parse(syncJson);
      setSyncStatus('در حال ارسال اعتبارنامه‌ها...');
      const res = await fetch('/api/v1/integrations/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setSyncStatus(`موفقیت‌آمیز: نشست ${payload.site_name} با موفقیت ثبت شد.`);
        setSyncJson('');
        fetchSessions();
      } else {
        setSyncStatus(`خطا: ${result.error || 'ارسال ناموفق بود'}`);
      }
    } catch (err: any) {
      setSyncStatus(`فرمت JSON نامعتبر است: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const curlExample = `curl -X POST /api/v1/integrations/sync-session \\
  -H "Content-Type: application/json" \\
  -d '{
    "site_name": "alibaba",
    "cookies": "_ali_session=...; is_iran_net=1",
    "proxy_binding": "http://5.160.201.213:8080",
    "status": "active"
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in font-sans">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Secret / Hidden Admin Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl border border-amber-500/20">
              <LockOutlined />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  پنل مدیریت پنهان: کوکی‌ها، اعتبارنامه‌ها و پروکسی ایران
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                  Hidden / Internal Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                دسترسی مستقیم توسعه‌دهنده به کوکی‌ها، نشست‌های کراولر و مسیریابی آی‌پی ایران (مخفی از کاربران عادی)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Action Banner & Global Auto-Update Button */}
        <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDarkMode ? 'bg-amber-950/20 border-amber-800/30' : 'bg-amber-50/60 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-medium">
            <ThunderboltOutlined className="text-amber-500 text-sm" />
            <span>نوسازی فوری کوکی‌ها و توکن‌ها از طریق شبکه ایران:</span>
          </div>
          
          <button
            onClick={() => handleAutoRefreshCreds()}
            disabled={refreshingCreds}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
          >
            <SyncOutlined spin={refreshingCreds} />
            <span>⚡ بروزرسانی کوکی‌ها و اعتبارنامه‌ها (Update Cookies & Creds)</span>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className={`px-6 pt-3 border-b flex gap-4 ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/40'}`}>
          <button
            onClick={() => setActiveTab('creds')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'creds'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SafetyCertificateOutlined />
            <span>نشست‌ها و کوکی‌های ارائه‌دهندگان</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">
              {sessions.filter((s) => s.has_cookies).length}/3
            </span>
          </button>

          <button
            onClick={() => setActiveTab('iran_proxy')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'iran_proxy'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GlobalOutlined />
            <span>استخر پروکسی‌های ایران (Iran Proxies)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">
              {proxies.length}
            </span>
          </button>
        </div>

        {/* Status Notification */}
        {syncStatus && (
          <div className={`px-6 py-2 text-xs border-b flex items-center justify-between ${
            syncStatus.includes('✅')
              ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
              : syncStatus.includes('❌')
              ? 'bg-rose-950/30 text-rose-300 border-rose-800/40'
              : 'bg-amber-950/30 text-amber-300 border-amber-800/40'
          }`}>
            <span>{syncStatus}</span>
            <button onClick={() => setSyncStatus(null)} className="text-[10px] opacity-70 hover:opacity-100">بستن</button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'creds' && (
            <div className="space-y-6">
              {/* Providers Status Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    وضعیت اعتبارنامه‌های ۳ ارائه‌دهنده اصلی
                  </h4>
                  <button
                    onClick={fetchSessions}
                    disabled={loading}
                    className="text-xs text-sky-500 hover:text-sky-400 flex items-center gap-1 font-medium transition-colors"
                  >
                    <SyncOutlined spin={loading} />
                    بروزرسانی وضعیت
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sessions.map((s) => {
                    const isActive = s.status === 'active' && s.has_cookies;
                    return (
                      <div
                        key={s.site_name}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                          isDarkMode
                            ? 'bg-slate-800/30 border-slate-700/50'
                            : 'bg-slate-50/80 border-slate-200/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ProviderLogo provider={s.site_name} size="sm" />
                              <span className="font-bold text-sm capitalize">{s.site_name}</span>
                            </div>
                            {isActive ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircleFilled /> آماده لایو
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                <WarningFilled /> نیازمند کوکی
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-400 mt-2 font-mono">
                            <div>کوکی فعال: {s.has_cookies ? '✅ ثبت شده' : '❌ مفقود'}</div>
                            <div className="truncate">پروکسی: {s.proxy_binding || 'مستقیم (ایران)'}</div>
                            <div className="truncate">آخرین استفاده: {s.last_used_at ? new Date(s.last_used_at).toLocaleTimeString() : '---'}</div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-700/30 flex justify-end">
                          <button
                            onClick={() => handleAutoRefreshCreds(s.site_name)}
                            disabled={refreshingCreds}
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                          >
                            <SyncOutlined spin={refreshingCreds} />
                            نوسازی کوکی این ارائه‌دهنده
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Manual Ingestion / Injection */}
              <div
                className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-300">
                  <CloudUploadOutlined className="text-sky-500" />
                  <span>تزریق مستقیم سشن و کوکی دستی (Manual Session Ingestion)</span>
                </div>
                <textarea
                  value={syncJson}
                  onChange={(e) => setSyncJson(e.target.value)}
                  placeholder={`{\n  "site_name": "alibaba",\n  "cookies": "_ali_sess=...; auth_token=...",\n  "proxy_binding": "http://5.160.201.213:8080"\n}`}
                  rows={3}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono border focus:outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-sky-500'
                      : 'bg-white border-slate-300 text-slate-800 focus:border-sky-500'
                  }`}
                />
                <div className="flex items-center justify-end mt-2">
                  <button
                    onClick={handleManualSync}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white transition-colors cursor-pointer"
                  >
                    ثبت و ذخیره در Firestore
                  </button>
                </div>
              </div>

              {/* cURL & Python Script instruction */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-400">
                    <CodeOutlined />
                    <span>دستور ارسال خودکار کوکی از محیط محلی یا اسکریپت generate_sessions.py</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(curlExample, 'curl')}
                    className="text-xs text-sky-500 hover:text-sky-400 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                  >
                    <CopyOutlined />
                    {copiedKey === 'curl' ? 'کپی شد!' : 'کپی cURL'}
                  </button>
                </div>
                <pre
                  className={`p-3 rounded-xl text-[11px] font-mono overflow-x-auto border ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  {curlExample}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'iran_proxy' && (
            <div className="space-y-6">
              {/* Active Proxy Card & Actions */}
              <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-blue-50/70 border-blue-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">پروکسی فعال ایران:</span>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                      {activeProxy ? activeProxy.url : 'http://5.160.201.213:8080 (پیش‌فرض ایران)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    درخواست‌های ارائه‌دهندگان ایرانی (علی‌بابا، فلای‌تودی، سفرمارکت) از طریق این آی‌پی ایران ارسال می‌شوند تا از انسداد جغرافیایی جلوگیری شود.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSearchIranProxies}
                    disabled={searchingProxies}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    <SearchOutlined spin={searchingProxies} />
                    <span>جستجو و دریافت پروکسی تازه ایران</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Iran Proxy */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <PlusOutlined className="text-blue-500" />
                  <span>افزودن پروکسی اختصاصی ایران (Residential / Datacenter Iran Proxy)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={customProxyUrl}
                    onChange={(e) => setCustomProxyUrl(e.target.value)}
                    placeholder="http://ip:port یا socks5://user:pass@ip:port"
                    className={`md:col-span-2 p-2 rounded-lg text-xs font-mono border focus:outline-none ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customProxyName}
                      onChange={(e) => setCustomProxyName(e.target.value)}
                      placeholder="نام ارائه‌دهنده (اختیاری)"
                      className={`flex-1 p-2 rounded-lg text-xs border focus:outline-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                    <button
                      onClick={handleAddCustomProxy}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                    >
                      افزودن
                    </button>
                  </div>
                </div>
              </div>

              {/* Proxy Pool Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2">لیست پروکسی‌های شناسایی‌شده ایرانی ({proxies.length})</h4>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <table className="w-full text-xs text-right">
                    <thead className={`text-[11px] uppercase ${isDarkMode ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                      <tr>
                        <th className="p-3">آدرس و پورت</th>
                        <th className="p-3">پروتکل</th>
                        <th className="p-3">ISP / اپراتور</th>
                        <th className="p-3">وضعیت</th>
                        <th className="p-3">تاخیر</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                      {proxies.map((p) => {
                        const isTesting = testingProxyUrl === p.url;
                        return (
                          <tr key={p.url} className={isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                            <td className="p-3 font-bold">{p.url}</td>
                            <td className="p-3 uppercase text-blue-400">{p.protocol}</td>
                            <td className="p-3 font-sans text-slate-400">{p.provider || 'Iran Public'}</td>
                            <td className="p-3">
                              {p.status === 'active' ? (
                                <span className="text-emerald-400 font-sans">🟢 فعال</span>
                              ) : p.status === 'failed' ? (
                                <span className="text-rose-400 font-sans">🔴 ناموفق</span>
                              ) : (
                                <span className="text-slate-500 font-sans">⚪ تست‌نشده</span>
                              )}
                            </td>
                            <td className="p-3">{p.latencyMs ? `${p.latencyMs}ms` : '---'}</td>
                            <td className="p-3 text-center font-sans">
                              <button
                                onClick={() => handleTestProxy(p.url)}
                                disabled={isTesting}
                                className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                              >
                                {isTesting ? <SyncOutlined spin /> : 'تست اتصال'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <span className="text-[11px] text-slate-400">
            برای باز کردن مجدد این پنجره می‌توانید از کلید میانبر <kbd className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-amber-400">Ctrl + Shift + C</kbd> استفاده کنید.
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
