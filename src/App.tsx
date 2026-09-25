import React, { useState, useEffect, useMemo } from 'react';
import {
  ConfigProvider,
  Layout,
  Card,
  Row,
  Col,
  Space,
  Select,
  Button,
  Tag,
  Badge,
  Tabs,
  Modal,
  Drawer,
  Spin,
  Statistic,
  Alert,
  Divider,
  Collapse,
  DatePicker,
  Radio,
  Checkbox,
  Input,
  Tooltip,
  theme,
  Progress,
  Switch,
} from 'antd';
import faIR from 'antd/locale/fa_IR';
import dayjs, { Dayjs } from 'dayjs';
import {
  SearchOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  KeyOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  GlobalOutlined,
  ApartmentOutlined,
  InfoCircleOutlined,
  TagOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  FilterOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CodeOutlined,
  CompassOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { ProviderLogo, ProviderType } from './components/ProviderLogo';
import { GroupingKeyModal } from './components/GroupingKeyModal';
import { DurationHistogram } from './components/DurationHistogram';
import { FlightCardItem } from './components/FlightCardItem';
import { ProviderSessionManagerModal } from './components/ProviderSessionManagerModal';
import { logSearchToFirebase, saveBookingToFirebase } from './firebase/flightService';
import { testFirebaseConnection } from './firebase/config';

const { Header, Content, Footer } = Layout;

interface AirportChild {
  iata: string;
  type: string;
  isDomestic: boolean;
  name: string;
  cityName: string | null;
  countryCode: string;
  countryName: string;
  latitude: number | null;
  longitude: number | null;
}

interface AirportCity {
  iata: string;
  type: string;
  isDomestic: boolean;
  name: string;
  countryCode: string;
  countryName: string;
  children: AirportChild[];
}

interface ProviderOffer {
  provider: ProviderType;
  providerName: string;
  providerOfferRef: string;
  totalPrice: number;
  basePrice: number;
  taxAmount: number;
  currency: string;
  baggage: string;
  seatsRemaining: number;
  cancellationPolicy: string;
  isCharter: boolean;
  cabin: string;
  deepLink?: string;
}

interface GroupedFlightCard {
  id: string; // generated flight hash
  groupingKey: string;
  airline: {
    name: string;
    nameFa: string;
    code: string;
    iata: string;
  };
  flightNumber: string;
  origin: string;
  originName?: string;
  destination: string;
  destinationName?: string;
  departureAt: string;
  arrivalAt: string;
  duration: string;
  durationMinutes: number;
  stops: number;
  cabin: string;
  isDomestic: boolean;
  providers: ProviderOffer[];
  providerCount: number;
  bestPrice: ProviderOffer;
  highestPrice: ProviderOffer;
  savings: number;
}

export type FlightSortOption = 'Cheapest' | 'Fastest' | 'Earliest';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('grouped_search');

  // Accessible Dark/Light Theme mode toggle with Ant Design theme integration
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('buyo_theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('buyo_theme_mode', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Flight Sorting Option: Strictly 'Cheapest' | 'Fastest' | 'Earliest' per user instruction
  const [sortBy, setSortBy] = useState<FlightSortOption>('Cheapest');

  // Search parameters
  const [origin, setOrigin] = useState<{ code: string; name: string; city: string }>({
    code: 'THR',
    name: 'تهران (مهرآباد / امام خمینی)',
    city: 'تهران',
  });
  const [destination, setDestination] = useState<{ code: string; name: string; city: string }>({
    code: 'MHD',
    name: 'مشهد (شهید هاشمی‌نژاد)',
    city: 'مشهد',
  });
  const [depDate, setDepDate] = useState<Dayjs>(dayjs('2026-06-02'));
  const [cabin, setCabin] = useState<string>('economy');
  const [selectedProviders, setSelectedProviders] = useState<ProviderType[]>([
    'alibaba',
    'flytoday',
    'safarmarket',
  ]);

  // Autocomplete airport search options
  const [originOptions, setOriginOptions] = useState<{ value: string; label: React.ReactNode; raw: any }[]>([]);
  const [destOptions, setDestOptions] = useState<{ value: string; label: React.ReactNode; raw: any }[]>([]);

  // Flight search execution & results
  const [isSearching, setIsSearching] = useState(false);
  const [groupedFlights, setGroupedFlights] = useState<GroupedFlightCard[]>([]);
  const [rawOffersCount, setRawOffersCount] = useState(0);

  // Grouping Key Inspector modal
  const [inspectingFlight, setInspectingFlight] = useState<GroupedFlightCard | null>(null);

  // Booking drawer
  const [selectedBooking, setSelectedBooking] = useState<{
    flight: GroupedFlightCard;
    providerOffer: ProviderOffer;
  } | null>(null);

  // Airport Directory tab state
  const [dirQuery, setDirQuery] = useState('تهران');
  const [dirResults, setDirResults] = useState<AirportCity[]>([]);
  const [isDirLoading, setIsDirLoading] = useState(false);

  // Key Sandbox tab state
  const [sandboxForm, setSandboxForm] = useState({
    airlineCode: 'W5',
    flightNumber: 'W5-1024',
    origin: 'THR',
    destination: 'MHD',
    departureAt: '2026-06-02T06:30:00Z',
    cabin: 'economy',
  });
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // DB Bootstrap & Seed state
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapLogs, setBootstrapLogs] = useState<{ bootstrap?: string; seed?: string; error?: string } | null>(
    null
  );

  // Firebase state
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [bookingSuccessId, setBookingSuccessId] = useState<string | null>(null);
  const [isBookingSaving, setIsBookingSaving] = useState<boolean>(false);

  // Crawler Provider Sessions modal state (secret developer/admin mode)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('admin') || urlParams.has('dev') || urlParams.has('creds') || localStorage.getItem('buyo_dev_mode') === 'true';
  });
  const [secretClickCount, setSecretClickCount] = useState<number>(0);

  // Hidden admin mode key listener (Ctrl+Shift+C or Alt+Shift+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.key === 'K' || e.key === 'k')) {
        e.preventDefault();
        setIsAdminMode(true);
        setIsSessionModalOpen((prev) => !prev);
        try {
          localStorage.setItem('buyo_dev_mode', 'true');
        } catch {}
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSecretTrigger = () => {
    const next = secretClickCount + 1;
    setSecretClickCount(next);
    if (next >= 3) {
      setIsAdminMode(true);
      setIsSessionModalOpen(true);
      setSecretClickCount(0);
      try {
        localStorage.setItem('buyo_dev_mode', 'true');
      } catch {}
    }
  };

  // Initial load
  useEffect(() => {
    testFirebaseConnection().then((connected) => setFirebaseConnected(connected));
    performSearch();
    loadDirectory('تهران');
    calculateSandboxKey();
    fetchDbStatus();
  }, []);

  // Fetch Airport suggestions for Autocomplete
  const fetchAirportSuggestions = async (q: string, setter: (options: any[]) => void) => {
    if (!q || q.trim().length === 0) return;
    try {
      const res = await fetch(`/api/airports/search?q=${encodeURIComponent(q)}&limit=12`);
      if (res.ok) {
        const data: AirportCity[] = await res.json();
        const options = data.map((item) => ({
          value: item.iata,
          label: (
            <div className="flex items-center justify-between py-1 text-right">
              <div>
                <span className="font-bold text-slate-100">{item.name}</span>
                <span className="text-xs text-slate-400 mr-2">
                  ({item.countryName} • {item.children?.length || 1} فرودگاه)
                </span>
              </div>
              <Tag color="blue" className="font-mono font-bold mr-0">
                {item.iata}
              </Tag>
            </div>
          ),
          raw: item,
        }));
        setter(options);
      }
    } catch (err) {
      console.error('Failed to search airports:', err);
    }
  };

  const performSearch = async (overrideSort?: FlightSortOption) => {
    setIsSearching(true);
    try {
      const payload = {
        origin: { code: origin.code },
        destination: { code: destination.code },
        departure_date: depDate ? depDate.format('YYYY-MM-DD') : '2026-06-02',
        cabin,
        providers: selectedProviders,
      };

      const createRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) throw new Error('Search failed');
      const createData = await createRes.json();
      const sessionId = createData.session_id;

      // Poll offers with selected sort option
      const currentSort = overrideSort || sortBy;
      const offersRes = await fetch(`/api/search/${sessionId}/offers?sort=${currentSort}`);
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setGroupedFlights(offersData.grouped_cards || []);
        setRawOffersCount(offersData.raw_offers_count || 0);

        // Persist session to Firebase Firestore
        logSearchToFirebase({
          origin: origin.code,
          destination: destination.code,
          departureDate: depDate ? depDate.format('YYYY-MM-DD') : '2026-06-02',
          cabin,
          providers: selectedProviders,
          offersCount: offersData.raw_offers_count || 0,
          groupedFlightsCount: (offersData.grouped_cards || []).length,
        });
      }
    } catch (err) {
      console.error('Failed to search flights:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/bootstrap/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch DB status:', err);
    }
  };

  const runDbBootstrap = async () => {
    setIsBootstrapping(true);
    setBootstrapLogs(null);
    try {
      const res = await fetch('/api/bootstrap/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBootstrapLogs({
          bootstrap: data.bootstrapLog,
          seed: data.seedLog,
        });
        fetchDbStatus();
      } else {
        setBootstrapLogs({ error: data.error });
      }
    } catch (err: any) {
      setBootstrapLogs({ error: err.message || 'Bootstrap execution failed' });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const loadDirectory = async (q: string) => {
    setIsDirLoading(true);
    try {
      const res = await fetch(`/api/airports/search?q=${encodeURIComponent(q)}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setDirResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDirLoading(false);
    }
  };

  const calculateSandboxKey = async () => {
    try {
      const res = await fetch('/api/search/group-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sandboxForm),
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxResult(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const swapOriginDest = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Duration histogram filter state
  const [selectedDurationBin, setSelectedDurationBin] = useState<{
    key: string;
    minMinutes: number;
    maxMinutes: number;
  } | null>(null);

  // Grouped flights sorted strictly by the 3 options: 'Cheapest', 'Fastest', or 'Earliest'
  const sortedFlights = useMemo(() => {
    let list = [...groupedFlights];

    // Filter by duration window if selected in the Recharts histogram
    if (selectedDurationBin) {
      list = list.filter(
        (f) =>
          f.durationMinutes >= selectedDurationBin.minMinutes &&
          f.durationMinutes <= selectedDurationBin.maxMinutes
      );
    }

    if (sortBy === 'Cheapest') {
      return list.sort((a, b) => a.bestPrice.totalPrice - b.bestPrice.totalPrice);
    }
    if (sortBy === 'Fastest') {
      return list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    }
    if (sortBy === 'Earliest') {
      return list.sort((a, b) => {
        const timeA = new Date(a.departureAt).getTime();
        const timeB = new Date(b.departureAt).getTime();
        return timeA - timeB;
      });
    }
    return list;
  }, [groupedFlights, sortBy, selectedDurationBin]);

  // Derived minimums for UI badges
  const minPrice = useMemo(() => {
    if (groupedFlights.length === 0) return 0;
    return Math.min(...groupedFlights.map((f) => f.bestPrice.totalPrice));
  }, [groupedFlights]);

  const minDuration = useMemo(() => {
    if (groupedFlights.length === 0) return 0;
    return Math.min(...groupedFlights.map((f) => f.durationMinutes));
  }, [groupedFlights]);

  const earliestTime = useMemo(() => {
    if (groupedFlights.length === 0) return 0;
    return Math.min(...groupedFlights.map((f) => new Date(f.departureAt).getTime()));
  }, [groupedFlights]);

  const formatRial = (amount: number) => {
    return `${amount.toLocaleString('fa-IR')} ریال`;
  };

  const formatToman = (amount: number) => {
    const toman = Math.round(amount / 10);
    return `${toman.toLocaleString('fa-IR')} تومان`;
  };

  return (
    <ConfigProvider
      direction="rtl"
      locale={faIR}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          colorBgBase: isDarkMode ? '#0b1120' : '#f8fafc',
          colorBgContainer: isDarkMode ? '#131e36' : '#ffffff',
          colorBorder: isDarkMode ? '#223254' : '#e2e8f0',
          colorTextBase: isDarkMode ? '#f8fafc' : '#0f172a',
          colorTextSecondary: isDarkMode ? '#94a3b8' : '#64748b',
          borderRadius: 12,
          fontFamily: "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Card: {
            colorBgContainer: isDarkMode ? '#111927' : '#ffffff',
            colorBorderSecondary: isDarkMode ? '#1e293b' : '#f1f5f9',
          },
          Select: {
            colorBgContainer: isDarkMode ? '#0f172a' : '#ffffff',
            colorBorder: isDarkMode ? '#334155' : '#cbd5e1',
          },
        },
      }}
    >
      <Layout
        className={`min-h-screen font-sans transition-colors duration-200 ${
          isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
        dir="rtl"
      >
        {/* Grouping Key Inspector Modal */}
        <GroupingKeyModal
          isOpen={Boolean(inspectingFlight)}
          onClose={() => setInspectingFlight(null)}
          flightCard={inspectingFlight}
        />

        {/* Header - Sleek, Responsive, Anti-Slop Navigation with Theme Switcher */}
        <Header
          className={`px-3 sm:px-6 h-auto py-2.5 sm:py-3.5 backdrop-blur-md sticky top-0 z-50 shadow-md border-b transition-colors duration-200 ${
            isDarkMode
              ? 'bg-[#0b1324]/95 border-slate-800 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Brand and Status row with Accessibility Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
                  <RocketOutlined className="text-base sm:text-lg transform -rotate-45" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                      موتور تجمیع پرواز BuyO
                    </span>
                    <span
                      onClick={handleSecretTrigger}
                      title="حالت مدیریت داخلی (۳ بار کلیک)"
                      className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer select-none transition-transform active:scale-95 ${
                        isDarkMode
                          ? 'bg-blue-900/50 text-blue-300 border-blue-700/50'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      Multi-Crawler
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        firebaseConnected
                          ? isDarkMode
                            ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      {firebaseConnected ? '🔥 متصل' : 'آفلاین'}
                    </span>
                  </div>
                  <p className={`text-[11px] m-0 hidden sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    تجمیع و گروه‌بندی هوشمند کراولرهای علی‌بابا، فلای‌تودی و سفرمارکت
                  </p>
                </div>
              </div>

              {/* Theme Mode Toggle with Ant Design Switch and Accessibility Tooltip */}
              <Tooltip title={isDarkMode ? 'تغییر به تم روشن برای دسترسی‌پذیری و خوانایی در نور روز' : 'تغییر به تم تاریک'}>
                <div
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  role="button"
                  tabIndex={0}
                  aria-label="تغییر تم"
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all select-none ${
                    isDarkMode
                      ? 'bg-slate-800/90 hover:bg-slate-800 text-amber-300 border-slate-700 shadow-inner'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
                  }`}
                >
                  <Switch
                    size="small"
                    checked={isDarkMode}
                    onChange={(checked) => setIsDarkMode(checked)}
                    checkedChildren={<MoonOutlined className="text-amber-200" />}
                    unCheckedChildren={<SunOutlined className="text-amber-500" />}
                  />
                  <span className="text-[11px] font-medium hidden xs:inline-block">
                    {isDarkMode ? 'تم تیره' : 'تم روشن'}
                  </span>
                </div>
              </Tooltip>
            </div>

            {/* Navigation Tabs - Horizontally scrollable on mobile without wrapping */}
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('grouped_search')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'grouped_search'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDarkMode
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <ApartmentOutlined />
                <span>جستجوی پرواز</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('airports')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'airports'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDarkMode
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <GlobalOutlined />
                <span>بانک فرودگاه‌ها (۹,۳۲۰)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('key_sandbox')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'key_sandbox'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDarkMode
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <KeyOutlined />
                <span>فرمول کلید پرواز</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('db_bootstrap')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeTab === 'db_bootstrap'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDarkMode
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <DatabaseOutlined />
                <span>راه‌اندازی دیتابیس</span>
              </button>
              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(true)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer border ${
                    isDarkMode
                      ? 'bg-amber-950/40 text-amber-300 border-amber-600/50 hover:bg-amber-900/60'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  }`}
                  title="پنل مدیریت داخلی: کوکی‌ها، اعتبارنامه‌ها و پروکسی ایران (Ctrl+Shift+C)"
                >
                  <SafetyCertificateOutlined />
                  <span className="font-mono text-[11px]">Creds / Iran Proxy</span>
                </button>
              )}
            </div>
          </div>
        </Header>

        {/* Main Content Area */}
        <Content className="max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
          {/* TAB 1: GROUPED FLIGHT SEARCH */}
          {activeTab === 'grouped_search' && (
            <div className="space-y-6">
              {/* Dynamic Flight Search Panel */}
              <Card
                className={`transition-colors duration-200 border rounded-2xl shadow-xl ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'
                }`}
                styles={{ body: { padding: '24px' } }}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl flex-shrink-0">
                      <SearchOutlined className="text-base" />
                    </div>
                    <div>
                      <h2
                        className={`text-sm sm:text-base font-extrabold m-0 ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        جستجوی پرواز و استعلام چندگانه
                      </h2>
                      <p className={`text-[11px] m-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        ادغام هوشمند و مقایسه نرخ‌ها از ۳ تامین‌کننده
                      </p>
                    </div>
                  </div>

                  {/* Active Providers Checkboxes */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className={`font-semibold ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      تامین‌کنندگان:
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

                {/* Form Controls */}
                <Row gutter={[12, 12]} align="bottom">
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
                      onSearch={(val) => fetchAirportSuggestions(val, setOriginOptions)}
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
                      options={originOptions.length > 0 ? originOptions : [
                        { value: 'THR', label: 'تهران (THR - فرودگاه مهرآباد)', raw: { iata: 'THR', name: 'تهران', countryName: 'ایران' } },
                        { value: 'IKA', label: 'تهران (IKA - فرودگاه امام خمینی)', raw: { iata: 'IKA', name: 'تهران', countryName: 'ایران' } },
                        { value: 'MHD', label: 'مشهد (MHD - شهید هاشمی‌نژاد)', raw: { iata: 'MHD', name: 'مشهد', countryName: 'ایران' } },
                        { value: 'SYZ', label: 'شیراز (SYZ - شهید دستغیب)', raw: { iata: 'SYZ', name: 'شیراز', countryName: 'ایران' } },
                        { value: 'ISF', label: 'اصفهان (IFN - شهید بهشتی)', raw: { iata: 'IFN', name: 'اصفهان', countryName: 'ایران' } },
                        { value: 'TBZ', label: 'تبریز (TBZ - شهید مدنی)', raw: { iata: 'TBZ', name: 'تبریز', countryName: 'ایران' } },
                        { value: 'KIH', label: 'کیش (KIH - فرودگاه بین‌المللی کیش)', raw: { iata: 'KIH', name: 'کیش', countryName: 'ایران' } },
                        { value: 'IST', label: 'استانبول (IST - Istanbul Airport)', raw: { iata: 'IST', name: 'استانبول', countryName: 'ترکیه' } },
                        { value: 'DXB', label: 'دبی (DXB - Dubai International)', raw: { iata: 'DXB', name: 'دبی', countryName: 'امارات' } },
                      ]}
                    />
                  </Col>

                  {/* Swap Button */}
                  <Col xs={24} md={2} className="flex justify-center pb-1">
                    <Button
                      size="large"
                      icon={<SwapOutlined />}
                      onClick={swapOriginDest}
                      className="rounded-xl w-full md:w-auto"
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
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">{destination.code}</span>
                    </label>
                    <Select
                      showSearch
                      size="large"
                      className="w-full"
                      placeholder="جستجوی شهر یا کد فرودگاه (مشهد, شیراز, کیش, ...)"
                      value={destination.code}
                      onSearch={(val) => fetchAirportSuggestions(val, setDestOptions)}
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
                      options={destOptions.length > 0 ? destOptions : [
                        { value: 'MHD', label: 'مشهد (MHD - شهید هاشمی‌نژاد)', raw: { iata: 'MHD', name: 'مشهد', countryName: 'ایران' } },
                        { value: 'THR', label: 'تهران (THR - مهرآباد)', raw: { iata: 'THR', name: 'تهران', countryName: 'ایران' } },
                        { value: 'SYZ', label: 'شیراز (SYZ - شهید دستغیب)', raw: { iata: 'SYZ', name: 'شیراز', countryName: 'ایران' } },
                        { value: 'KIH', label: 'کیش (KIH - فرودگاه کیش)', raw: { iata: 'KIH', name: 'کیش', countryName: 'ایران' } },
                        { value: 'ISF', label: 'اصفهان (IFN - شهید بهشتی)', raw: { iata: 'IFN', name: 'اصفهان', countryName: 'ایران' } },
                        { value: 'TBZ', label: 'تبریز (TBZ - شهید مدنی)', raw: { iata: 'TBZ', name: 'تبریز', countryName: 'ایران' } },
                        { value: 'BND', label: 'بندرعباس (BND)', raw: { iata: 'BND', name: 'بندرعباس', countryName: 'ایران' } },
                        { value: 'IST', label: 'استانبول (IST - ترکیه)', raw: { iata: 'IST', name: 'استانبول', countryName: 'ترکیه' } },
                        { value: 'DXB', label: 'دبی (DXB - امارات)', raw: { iata: 'DXB', name: 'دبی', countryName: 'امارات' } },
                      ]}
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
                      onClick={() => performSearch()}
                      className="w-full font-black text-sm rounded-xl h-[40px] shadow-lg shadow-blue-600/30"
                    >
                      جستجو
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* Aggregation & Deduplication Metric Bar */}
              <div
                className={`border rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm transition-colors duration-200 ${
                  isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>تعداد کل آفرهای استخراج‌شده: </span>
                    <span className="font-black text-amber-500 font-mono text-sm mr-1">
                      {rawOffersCount.toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <div className={`h-4 w-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  <div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>پروازهای فیزیکی یکپارچه: </span>
                    <span className="font-black text-emerald-500 font-mono text-sm mr-1">
                      {groupedFlights.length.toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <div className={`h-4 w-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  <div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>پروازهای چندتامین‌کننده‌ای: </span>
                    <span className="font-black text-blue-500 font-mono text-sm mr-1">
                      {groupedFlights.filter((f) => f.providerCount > 1).length.toLocaleString('fa-IR')} پرواز
                    </span>
                  </div>
                </div>

                <div className={`font-mono text-xs flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <KeyOutlined className="text-amber-500" />
                  <span>فرمول کلید: FLIGHT_AIRLINE_NUM_ORG_DST_TIME_CABIN</span>
                </div>
              </div>

              {/* Visual Histogram Chart using Recharts for Flight Duration Distribution */}
              {groupedFlights.length > 0 && (
                <DurationHistogram
                  flights={groupedFlights}
                  selectedBinKey={selectedDurationBin ? selectedDurationBin.key : null}
                  onSelectBin={(binKey, minM, maxM) => {
                    if (!binKey || minM === undefined || maxM === undefined) {
                      setSelectedDurationBin(null);
                    } else {
                      setSelectedDurationBin({ key: binKey, minMinutes: minM, maxMinutes: maxM });
                    }
                  }}
                />
              )}

              {/* Active Duration Filter Alert (if filtered via histogram) */}
              {selectedDurationBin && (
                <Alert
                  type="info"
                  showIcon
                  className="rounded-xl border-amber-500/40 bg-amber-950/30 text-amber-200"
                  message={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        فیلتر بازه زمانی فعال است: مدت زمان بین {selectedDurationBin.minMinutes} تا{' '}
                        {selectedDurationBin.maxMinutes} دقیقه (نمایش {sortedFlights.length} پرواز از{' '}
                        {groupedFlights.length} پرواز کل)
                      </span>
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        onClick={() => setSelectedDurationBin(null)}
                        className="text-xs rounded-lg border-amber-500 text-amber-300 hover:text-white"
                      >
                        پاک کردن فیلتر پنجره زمانی
                      </Button>
                    </div>
                  }
                />
              )}

              {/* Flight Results Sorting Toolbar (STRICTLY Fastest, Cheapest, Earliest) */}
              <Card
                className={`transition-colors duration-200 border rounded-xl shadow-sm ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'
                }`}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <div
                      className={`flex items-center gap-2 text-xs font-bold ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      <FilterOutlined className="text-blue-500" />
                      <span>مرتب‌سازی نتایج:</span>
                    </div>

                    {/* The requested Ant Design Dropdown - containing ONLY 'Cheapest', 'Fastest', 'Earliest' */}
                    <Select
                      size="middle"
                      className="w-full sm:w-56 font-bold text-xs"
                      value={sortBy}
                      onChange={(val) => setSortBy(val)}
                      options={[
                        { value: 'Cheapest', label: '💰 ارزان‌ترین قیمت (Cheapest)' },
                        { value: 'Fastest', label: '⚡ سریع‌ترین زمان (Fastest)' },
                        { value: 'Earliest', label: '🌅 زودترین پرواز (Earliest)' },
                      ]}
                    />

                    {/* Quick 1-Click Toggle Buttons for the 3 allowed options */}
                    <div
                      className={`flex items-center gap-1 p-0.5 rounded-lg border overflow-x-auto whitespace-nowrap scrollbar-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSortBy('Cheapest')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                          sortBy === 'Cheapest'
                            ? isDarkMode
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-white text-amber-700 shadow-sm border border-amber-300'
                            : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <TagOutlined className="text-amber-500 text-[10px]" />
                        ارزان‌ترین
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy('Fastest')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                          sortBy === 'Fastest'
                            ? isDarkMode
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-white text-sky-700 shadow-sm border border-sky-300'
                            : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ThunderboltOutlined className="text-sky-500 text-[10px]" />
                        سریع‌ترین
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy('Earliest')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                          sortBy === 'Earliest'
                            ? isDarkMode
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-white text-indigo-700 shadow-sm border border-indigo-300'
                            : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ClockCircleOutlined className="text-indigo-500 text-[10px]" />
                        زودترین
                      </button>
                    </div>
                  </div>

                  {/* Active Sort Explanation */}
                  <div
                    className={`text-[11px] flex items-center gap-1.5 self-start sm:self-auto ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>معیار:</span>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {sortBy === 'Cheapest' && '💰 ارزان‌ترین نرخ صادرشده به اولویت'}
                      {sortBy === 'Fastest' && '⚡ کوتاه‌ترین مدت زمان پرواز'}
                      {sortBy === 'Earliest' && '🌅 اولین زمان حرکت در طول شبانه‌روز'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Grouped Flight Cards List */}
              {isSearching ? (
                <div
                  className={`py-20 text-center space-y-3 rounded-2xl border transition-colors ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <Spin size="large" />
                  <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    در حال جستجو و ادغام پروازها از علی‌بابا، فلای‌تودی و سفرمارکت...
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sortedFlights.map((card) => {
                    const isCheapest = card.bestPrice.totalPrice === minPrice;
                    const isFastest = card.durationMinutes === minDuration;
                    const isEarliest = new Date(card.departureAt).getTime() === earliestTime;

                    return (
                      <FlightCardItem
                        key={card.id}
                        card={card}
                        isCheapest={isCheapest}
                        isFastest={isFastest}
                        isEarliest={isEarliest}
                        onInspectKey={setInspectingFlight}
                        onSelectBooking={(flight, offer) =>
                          setSelectedBooking({ flight, providerOffer: offer })
                        }
                        formatToman={formatToman}
                        formatRial={formatRial}
                      />
                    );
                  })}

                  {sortedFlights.length === 0 && !isSearching && (
                    <Card
                      className={`text-center py-16 rounded-2xl border transition-colors ${
                        isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <CompassOutlined className={`text-4xl mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                      <div className={`text-base font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                        هیچ پروازی برای مسیر {origin.code} به {destination.code} یافت نشد
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        لطفا مبدا، مقصد یا تاریخ دیگری را برای استعلام مجدد انتخاب کنید.
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AIRPORT SEARCH EXPLORER */}
          {activeTab === 'airports' && (
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
                  onSearch={(val) => loadDirectory(val)}
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
          )}

          {/* TAB 3: GROUPING KEY LAB */}
          {activeTab === 'key_sandbox' && (
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
                      value={sandboxForm.airlineCode}
                      onChange={(e) =>
                        setSandboxForm({ ...sandboxForm, airlineCode: e.target.value.toUpperCase() })
                      }
                      className="font-mono uppercase"
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      شماره پرواز
                    </label>
                    <Input
                      value={sandboxForm.flightNumber}
                      onChange={(e) =>
                        setSandboxForm({ ...sandboxForm, flightNumber: e.target.value.toUpperCase() })
                      }
                      className="font-mono uppercase"
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      مبدا (IATA)
                    </label>
                    <Input
                      value={sandboxForm.origin}
                      onChange={(e) => setSandboxForm({ ...sandboxForm, origin: e.target.value.toUpperCase() })}
                      className="font-mono uppercase"
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      مقصد (IATA)
                    </label>
                    <Input
                      value={sandboxForm.destination}
                      onChange={(e) =>
                        setSandboxForm({ ...sandboxForm, destination: e.target.value.toUpperCase() })
                      }
                      className="font-mono uppercase"
                    />
                  </Col>
                  <Col xs={24} md={5}>
                    <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      زمان حرکت (ISO)
                    </label>
                    <Input
                      value={sandboxForm.departureAt}
                      onChange={(e) => setSandboxForm({ ...sandboxForm, departureAt: e.target.value })}
                      className="font-mono"
                    />
                  </Col>
                  <Col xs={24} md={3}>
                    <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      کلاس پروازی
                    </label>
                    <Select
                      className="w-full"
                      value={sandboxForm.cabin}
                      onChange={(val) => setSandboxForm({ ...sandboxForm, cabin: val })}
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
                    onClick={calculateSandboxKey}
                    className="font-bold text-xs rounded-xl"
                  >
                    محاسبه کلید یکپارچه
                  </Button>
                </div>

                {sandboxResult && (
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
                        {sandboxResult.groupingKey}
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
                        {sandboxResult.flightHash}
                      </pre>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 4: DATABASE BOOTSTRAP & SEEDING */}
          {activeTab === 'db_bootstrap' && (
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
                    onClick={runDbBootstrap}
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
          )}
        </Content>

        {/* Booking Drawer Modal */}
        {selectedBooking && (
          <Modal
            open={Boolean(selectedBooking)}
            onCancel={() => setSelectedBooking(null)}
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
                    {selectedBooking.flight.airline.nameFa || selectedBooking.flight.airline.name}
                  </div>
                  <div className={`font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    شماره پرواز: {selectedBooking.flight.flightNumber}
                  </div>
                </div>
                <ProviderLogo provider={selectedBooking.providerOffer.provider} size="md" showLabel={true} />
              </div>

              <div
                className={`p-4 rounded-xl space-y-2 transition-colors ${
                  isDarkMode ? 'bg-slate-800/40' : 'bg-slate-100/70 border border-slate-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>قیمت نهایی:</span>
                  <span className={`font-extrabold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatToman(selectedBooking.providerOffer.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>معادل ریال:</span>
                  <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {formatRial(selectedBooking.providerOffer.totalPrice)}
                  </span>
                </div>
                <Divider className={`my-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`} />
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>مسیر:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {selectedBooking.flight.origin} ← {selectedBooking.flight.destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>زمان حرکت:</span>
                  <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {new Date(selectedBooking.flight.departureAt).toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>بار مجاز:</span>
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{selectedBooking.providerOffer.baggage}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>کلید یکپارچه فیزیکی:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px]">
                    {selectedBooking.flight.id}
                  </span>
                </div>
              </div>

              {bookingSuccessId ? (
                <div className="p-4 bg-emerald-950/40 dark:bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-center">
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
                    onClick={() => {
                      setSelectedBooking(null);
                      setBookingSuccessId(null);
                    }}
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
                    description={`کراولر ${selectedBooking.providerOffer.providerName} درخواست ثبت نام مسافر و ایجاد رزرو PNR را به صورت زنده انجام خواهد داد و داده در Firestore ذخیره خواهد شد.`}
                    className="rounded-xl text-[11px]"
                  />

                  <Button
                    type="primary"
                    size="large"
                    loading={isBookingSaving}
                    onClick={async () => {
                      if (!selectedBooking) return;
                      setIsBookingSaving(true);
                      try {
                        const docId = await saveBookingToFirebase({
                          flightId: selectedBooking.flight.id,
                          groupingKey: selectedBooking.flight.groupingKey,
                          flightNumber: selectedBooking.flight.flightNumber,
                          airlineName: selectedBooking.flight.airline.nameFa || selectedBooking.flight.airline.name,
                          origin: selectedBooking.flight.origin,
                          destination: selectedBooking.flight.destination,
                          departureAt: selectedBooking.flight.departureAt,
                          provider: selectedBooking.providerOffer.provider,
                          totalPrice: selectedBooking.providerOffer.totalPrice,
                          status: 'confirmed',
                        });
                        setBookingSuccessId(docId || `BK-${Date.now().toString(36).toUpperCase()}`);
                      } finally {
                        setIsBookingSaving(false);
                      }
                    }}
                    className="w-full font-bold text-xs rounded-xl"
                  >
                    تایید و ثبت نهایی رزرو
                  </Button>
                </>
              )}
            </div>
          </Modal>
        )}

        {/* Crawler Provider Session Manager Modal */}
        <ProviderSessionManagerModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          isDarkMode={isDarkMode}
        />

        {/* Footer */}
        <Footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
          سامانه تجمیع و ادغام پرواز BuyO • پشتیبانی بلادرنگ از کراولرهای علی‌بابا، فلای‌تودی و سفرمارکت
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
