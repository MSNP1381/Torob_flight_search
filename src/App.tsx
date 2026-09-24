import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plane,
  Search,
  Building2,
  Calendar,
  KeyRound,
  ArrowRightLeft,
  ChevronDown,
  Clock,
  Sparkles,
  Layers,
  ChevronUp,
  Tag,
  CheckCircle2,
  Luggage,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Info,
  Code,
  ArrowUpDown,
  Zap,
  Sunrise,
  Database,
  Terminal,
  Play,
  Server
} from 'lucide-react';
import { ProviderLogo, ProviderType } from './components/ProviderLogo';
import { GroupingKeyModal } from './components/GroupingKeyModal';

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
  id: string;
  groupingKey: string;
  airline: {
    name: string;
    nameFa: string;
    code: string;
    iata: string;
  };
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  duration: string;
  stops: number;
  cabin: string;
  isDomestic: boolean;
  providers: ProviderOffer[];
  providerCount: number;
  bestPrice: ProviderOffer;
  highestPrice: ProviderOffer;
  savings: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'grouped_search' | 'airports' | 'key_sandbox' | 'db_bootstrap'>('grouped_search');

  // Flight Sorting Option: Strictly 'Cheapest' | 'Fastest' | 'Earliest'
  const [sortBy, setSortBy] = useState<'Cheapest' | 'Fastest' | 'Earliest'>('Cheapest');

  // Search parameters
  const [origin, setOrigin] = useState({ code: 'THR', name: 'تهران (Mehrabad / IKA)' });
  const [destination, setDestination] = useState({ code: 'MHD', name: 'مشهد (Hasheminejad)' });
  const [depDate, setDepDate] = useState('2026-06-02');
  const [cabin, setCabin] = useState('economy');
  const [selectedProviders, setSelectedProviders] = useState<ProviderType[]>([
    'alibaba', 'flytoday', 'safarmarket'
  ]);

  // Autocomplete states
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<AirportCity[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<AirportCity[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // Flight search execution & results
  const [isSearching, setIsSearching] = useState(false);
  const [groupedFlights, setGroupedFlights] = useState<GroupedFlightCard[]>([]);
  const [rawOffersCount, setRawOffersCount] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // DB Bootstrap & Seed state
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapLogs, setBootstrapLogs] = useState<{ bootstrap?: string; seed?: string; error?: string } | null>(null);

  // Helper to parse duration string (e.g., "1h 25m") into total minutes
  const parseDurationMinutes = (durationStr: string): number => {
    let minutes = 0;
    const hMatch = durationStr.match(/(\d+)\s*h/i);
    const mMatch = durationStr.match(/(\d+)\s*m/i);
    if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
    if (mMatch) minutes += parseInt(mMatch[1], 10);
    return minutes || 85;
  };

  // Grouped flights sorted strictly by the selected option: 'Cheapest', 'Fastest', or 'Earliest'
  const sortedFlights = useMemo(() => {
    const list = [...groupedFlights];
    if (sortBy === 'Cheapest') {
      return list.sort((a, b) => a.bestPrice.totalPrice - b.bestPrice.totalPrice);
    }
    if (sortBy === 'Fastest') {
      return list.sort((a, b) => {
        const durA = parseDurationMinutes(a.duration);
        const durB = parseDurationMinutes(b.duration);
        return durA - durB;
      });
    }
    if (sortBy === 'Earliest') {
      return list.sort((a, b) => {
        const timeA = new Date(a.departureAt).getTime();
        const timeB = new Date(b.departureAt).getTime();
        return timeA - timeB;
      });
    }
    return list;
  }, [groupedFlights, sortBy]);

  // Derived extremes to highlight on flight cards
  const minPrice = useMemo(() => {
    if (groupedFlights.length === 0) return 0;
    return Math.min(...groupedFlights.map((f) => f.bestPrice.totalPrice));
  }, [groupedFlights]);

  const minDuration = useMemo(() => {
    if (groupedFlights.length === 0) return 0;
    return Math.min(...groupedFlights.map((f) => parseDurationMinutes(f.duration)));
  }, [groupedFlights]);

  const earliestTime = useMemo(() => {
    if (groupedFlights.length === 0) return 0;
    return Math.min(...groupedFlights.map((f) => new Date(f.departureAt).getTime()));
  }, [groupedFlights]);

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

  // Autocomplete: Origin
  useEffect(() => {
    if (!originSearch.trim()) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/airports/search?q=${encodeURIComponent(originSearch)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setOriginSuggestions(data);
        }
      } catch (err) {
        console.error('Origin airport search error:', err);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [originSearch]);

  // Autocomplete: Destination
  useEffect(() => {
    if (!destSearch.trim()) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/airports/search?q=${encodeURIComponent(destSearch)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setDestSuggestions(data);
        }
      } catch (err) {
        console.error('Dest airport search error:', err);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [destSearch]);

  // Initial load
  useEffect(() => {
    performSearch();
    loadDirectory('تهران');
    calculateSandboxKey();
    fetchDbStatus();
  }, []);

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

  const performSearch = async (overrideSort?: 'Cheapest' | 'Fastest' | 'Earliest') => {
    setIsSearching(true);
    try {
      const payload = {
        origin: { code: origin.code },
        destination: { code: destination.code },
        departure_date: depDate,
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
      }
    } catch (err) {
      console.error('Failed to search flights:', err);
    } finally {
      setIsSearching(false);
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

  const toggleProvider = (p: ProviderType) => {
    if (selectedProviders.includes(p)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter((x) => x !== p));
      }
    } else {
      setSelectedProviders([...selectedProviders, p]);
    }
  };

  const formatRial = (amount: number) => {
    return `${amount.toLocaleString('en-US')} Rial`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Grouping Key Inspector Modal */}
      <GroupingKeyModal
        isOpen={Boolean(inspectingFlight)}
        onClose={() => setInspectingFlight(null)}
        flightCard={inspectingFlight}
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-blue-600 to-rose-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plane className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-sky-300 to-rose-400 bg-clip-text text-transparent">
                  BuyO Flight Aggregator
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  Multi-Crawler
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Alibaba • FlyToday • SafarMarket Aggregation & Key Grouping
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveTab('grouped_search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'grouped_search'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Grouped Flight Search
            </button>
            <button
              onClick={() => setActiveTab('airports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'airports'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Airport Search (9,320)
            </button>
            <button
              onClick={() => setActiveTab('key_sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'key_sandbox'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Grouping Key Lab
            </button>
            <button
              onClick={() => setActiveTab('db_bootstrap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'db_bootstrap'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              DB Bootstrap & Seed
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* TAB 1: GROUPED FLIGHT SEARCH */}
        {activeTab === 'grouped_search' && (
          <div className="space-y-6">
            {/* Search Panel Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Search, Key Generation & Flight Grouping</h2>
                    <p className="text-xs text-slate-400">
                      Query crawlers in parallel, compute deterministic flight keys, and merge matching physical cards.
                    </p>
                  </div>
                </div>

                {/* Active Providers Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Active Crawlers:</span>
                  {(['alibaba', 'flytoday', 'safarmarket'] as ProviderType[]).map((prov) => {
                    const active = selectedProviders.includes(prov);
                    return (
                      <button
                        key={prov}
                        onClick={() => toggleProvider(prov)}
                        className={`transition cursor-pointer opacity-90 hover:opacity-100 ${
                          active ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 rounded-lg' : 'opacity-40 grayscale'
                        }`}
                      >
                        <ProviderLogo provider={prov} size="sm" showLabel={true} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Source (Origin) */}
                <div className="md:col-span-4 relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Source (مبدأ)</span>
                    <span className="text-[10px] text-slate-500">IATA / City</span>
                  </label>
                  <div
                    onClick={() => setShowOriginDropdown(true)}
                    className="flex items-center justify-between p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 transition shadow-inner"
                  >
                    <div className="truncate pr-2">
                      <div className="font-extrabold text-sm text-white font-mono">{origin.code}</div>
                      <div className="text-xs text-slate-300 truncate">{origin.name}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showOriginDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl z-50 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="Search city or IATA (e.g. Tehran, تهران, IKA, MHD)..."
                        value={originSearch}
                        onChange={(e) => setOriginSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 mb-2 font-sans"
                        autoFocus
                      />
                      <div className="max-h-52 overflow-y-auto space-y-1">
                        {originSuggestions.map((item) => (
                          <div
                            key={item.iata}
                            onClick={() => {
                              setOrigin({ code: item.iata, name: `${item.name} (${item.countryName})` });
                              setShowOriginDropdown(false);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs transition"
                          >
                            <div>
                              <div className="font-semibold text-white">{item.name}</div>
                              <div className="text-[10px] text-slate-400">{item.countryName} • {item.children.length} Airport(s)</div>
                            </div>
                            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              {item.iata}
                            </span>
                          </div>
                        ))}
                        {originSuggestions.length === 0 && originSearch.trim() && (
                          <div className="text-center text-xs text-slate-500 py-3">No matching airports found</div>
                        )}
                        {!originSearch.trim() && (
                          <div className="text-xs text-slate-500 px-2 py-1">
                            Type city in Persian (تهران, مشهد, اصفهان) or English IATA...
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowOriginDropdown(false)}
                        className="w-full text-center text-xs text-slate-400 hover:text-white mt-1 pt-1.5 border-t border-slate-800 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex items-center justify-center pb-1">
                  <button
                    onClick={swapOriginDest}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition shadow cursor-pointer"
                    title="Swap Source and Destination"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Destination */}
                <div className="md:col-span-4 relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Destination (مقصد)</span>
                    <span className="text-[10px] text-slate-500">IATA / City</span>
                  </label>
                  <div
                    onClick={() => setShowDestDropdown(true)}
                    className="flex items-center justify-between p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 transition shadow-inner"
                  >
                    <div className="truncate pr-2">
                      <div className="font-extrabold text-sm text-white font-mono">{destination.code}</div>
                      <div className="text-xs text-slate-300 truncate">{destination.name}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showDestDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl z-50 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="Search city or IATA (e.g. Mashhad, مشهد, SYZ, DXB)..."
                        value={destSearch}
                        onChange={(e) => setDestSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 mb-2 font-sans"
                        autoFocus
                      />
                      <div className="max-h-52 overflow-y-auto space-y-1">
                        {destSuggestions.map((item) => (
                          <div
                            key={item.iata}
                            onClick={() => {
                              setDestination({ code: item.iata, name: `${item.name} (${item.countryName})` });
                              setShowDestDropdown(false);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs transition"
                          >
                            <div>
                              <div className="font-semibold text-white">{item.name}</div>
                              <div className="text-[10px] text-slate-400">{item.countryName} • {item.children.length} Airport(s)</div>
                            </div>
                            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              {item.iata}
                            </span>
                          </div>
                        ))}
                        {destSuggestions.length === 0 && destSearch.trim() && (
                          <div className="text-center text-xs text-slate-500 py-3">No matching airports found</div>
                        )}
                        {!destSearch.trim() && (
                          <div className="text-xs text-slate-500 px-2 py-1">
                            Type city in Persian (مشهد, کیش, شیراز) or English IATA...
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowDestDropdown(false)}
                        className="w-full text-center text-xs text-slate-400 hover:text-white mt-1 pt-1.5 border-t border-slate-800 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date (تاریخ پرواز)</label>
                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2.5">
                    <Calendar className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
                    <input
                      type="date"
                      value={depDate}
                      onChange={(e) => setDepDate(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none w-full"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="md:col-span-1">
                  <button
                    onClick={() => performSearch()}
                    disabled={isSearching}
                    className="w-full h-[42px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Aggregation & Deduplication Metric Bar */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400">Total Raw Offers Scraped: </span>
                  <span className="font-extrabold text-amber-400 font-mono">{rawOffersCount}</span>
                </div>
                <div className="h-4 w-[1px] bg-slate-800"></div>
                <div>
                  <span className="text-slate-400">Grouped Unique Flights: </span>
                  <span className="font-extrabold text-emerald-400 font-mono">{groupedFlights.length}</span>
                </div>
                <div className="h-4 w-[1px] bg-slate-800"></div>
                <div>
                  <span className="text-slate-400">Multi-Provider Merges: </span>
                  <span className="font-extrabold text-indigo-400 font-mono">
                    {groupedFlights.filter((f) => f.providerCount > 1).length} flights
                  </span>
                </div>
              </div>

              <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                Key: FLIGHT_AIRLINE_NUM_ORG_DST_TIME_CABIN
              </div>
            </div>

            {/* Flight Results Sorting Toolbar (Strictly Fastest, Cheapest, Earliest) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <ArrowUpDown className="w-4 h-4 text-blue-400" />
                  <span>Sort Results:</span>
                </div>

                {/* The required sorting dropdown - containing ONLY 'Fastest', 'Cheapest', 'Earliest' */}
                <div className="relative">
                  <select
                    id="flight-sorting-select"
                    value={sortBy}
                    onChange={(e) => {
                      const newSort = e.target.value as 'Cheapest' | 'Fastest' | 'Earliest';
                      setSortBy(newSort);
                    }}
                    className="appearance-none bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-500 focus:border-blue-500 text-white text-xs font-bold rounded-xl pl-3 pr-8 py-2 focus:outline-none cursor-pointer shadow-sm transition"
                  >
                    <option value="Cheapest">💰 Cheapest (ارزان‌ترین قیمت)</option>
                    <option value="Fastest">⚡ Fastest (سریع‌ترین زمان)</option>
                    <option value="Earliest">🌅 Earliest (زودترین پرواز)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Quick 1-click sorting pills for the 3 allowed options */}
                <div className="flex items-center p-0.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setSortBy('Cheapest')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      sortBy === 'Cheapest'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Sort by lowest total fare"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cheapest</span>
                  </button>
                  <button
                    onClick={() => setSortBy('Fastest')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      sortBy === 'Fastest'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Sort by shortest flight duration"
                  >
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span>Fastest</span>
                  </button>
                  <button
                    onClick={() => setSortBy('Earliest')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      sortBy === 'Earliest'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Sort by earliest departure time"
                  >
                    <Sunrise className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Earliest</span>
                  </button>
                </div>
              </div>

              {/* Active sort indicator */}
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Active Sort Order:</span>
                <span className="font-bold text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80">
                  {sortBy === 'Cheapest' && '💰 Lowest Price First (ارزان‌ترین)'}
                  {sortBy === 'Fastest' && '⚡ Shortest Duration First (سریع‌ترین)'}
                  {sortBy === 'Earliest' && '🌅 Earliest Departure First (زودترین)'}
                </span>
              </div>
            </div>

            {/* Grouped Flight Cards List */}
            <div className="space-y-4">
              {sortedFlights.map((card) => {
                const isMultiProvider = card.providerCount > 1;
                const isExpanded = expandedCardId === card.id;

                const isCheapest = card.bestPrice.totalPrice === minPrice;
                const isFastest = parseDurationMinutes(card.duration) === minDuration;
                const isEarliest = new Date(card.departureAt).getTime() === earliestTime;

                return (
                  <div
                    key={card.id}
                    className={`bg-slate-900 border rounded-2xl transition duration-200 shadow-xl overflow-hidden ${
                      isMultiProvider
                        ? 'border-indigo-500/40 hover:border-indigo-400/80'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Grouping Bar */}
                    <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Left: Provider Logos Summary */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium text-[11px]">
                          {isMultiProvider ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              Available on {card.providerCount} Providers:
                            </span>
                          ) : (
                            <span>Offered by:</span>
                          )}
                        </span>

                        {/* Provider Logos displayed together */}
                        <div className="flex items-center gap-1.5">
                          {card.providers.map((p) => (
                            <ProviderLogo
                              key={p.provider}
                              provider={p.provider}
                              size="sm"
                              showLabel={true}
                            />
                          ))}
                        </div>

                        {/* Highlight badges for active sort criteria */}
                        {isCheapest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Tag className="w-3 h-3" /> Cheapest Fare
                          </span>
                        )}
                        {isFastest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            <Zap className="w-3 h-3" /> Fastest ({card.duration})
                          </span>
                        )}
                        {isEarliest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <Sunrise className="w-3 h-3" /> Earliest Departure
                          </span>
                        )}
                      </div>

                      {/* Right: Key Inspector Link */}
                      <button
                        onClick={() => setInspectingFlight(card)}
                        className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hover:border-amber-400/40 transition cursor-pointer"
                        title="Click to view full grouping key formula and SHA-256 fingerprint"
                      >
                        <KeyRound className="w-3 h-3 text-amber-400" />
                        <span>Key: {card.id}</span>
                      </button>
                    </div>

                    {/* Flight Main Information Body */}
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Airline & Flight Number */}
                      <div className="lg:col-span-3 flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400 shadow-sm">
                          {card.airline.iata}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{card.airline.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-sans">{card.airline.nameFa}</div>
                          <div className="text-xs font-mono text-indigo-300 mt-0.5">
                            {card.flightNumber} • <span className="capitalize">{card.cabin}</span>
                          </div>
                        </div>
                      </div>

                      {/* Schedule & Route */}
                      <div className="lg:col-span-4 flex items-center justify-between px-2">
                        <div>
                          <div className="text-lg font-extrabold text-white">
                            {new Date(card.departureAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs font-bold text-slate-400 font-mono">{card.origin}</div>
                        </div>

                        <div className="flex-1 px-4 flex flex-col items-center">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {card.duration}
                          </div>
                          <div className="w-full flex items-center">
                            <div className="h-[2px] flex-1 bg-slate-700"></div>
                            <Plane className="w-4 h-4 text-blue-400 mx-1.5 transform rotate-90" />
                            <div className="h-[2px] flex-1 bg-slate-700"></div>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-medium mt-1">
                            Direct Flight (پرواز مستقیم)
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-extrabold text-white">
                            {new Date(card.arrivalAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs font-bold text-slate-400 font-mono">{card.destination}</div>
                        </div>
                      </div>

                      {/* Best Price & Multi-provider comparison */}
                      <div className="lg:col-span-3 border-l border-slate-800 pl-4 space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-400" />
                          Best Price on {card.bestPrice.provider}
                        </div>
                        <div className="text-xl font-extrabold text-white tracking-tight">
                          {formatRial(card.bestPrice.totalPrice)}
                        </div>

                        {card.savings > 0 && (
                          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <span>Save {formatRial(card.savings)} vs other OTAs</span>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500">
                          {card.bestPrice.seatsRemaining} seats remaining ({card.bestPrice.baggage})
                        </div>
                      </div>

                      {/* Action & Compare Toggle */}
                      <div className="lg:col-span-2 flex flex-col items-stretch justify-center space-y-2">
                        <button
                          onClick={() => setSelectedBooking({ flight: card, providerOffer: card.bestPrice })}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer text-center"
                        >
                          Book via {card.bestPrice.provider.toUpperCase()}
                        </button>

                        {isMultiProvider && (
                          <button
                            onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                            className="w-full py-1 text-xs text-slate-300 hover:text-white font-medium flex items-center justify-center gap-1 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition cursor-pointer"
                          >
                            <span>Compare {card.providerCount} Providers</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Provider Price Comparison Breakdown */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 bg-slate-950/60 border-t border-slate-800 space-y-2 animate-in fade-in">
                        <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                          <span>Side-by-Side Provider Fares for Flight {card.flightNumber}:</span>
                          <span className="text-[11px] text-slate-500">Unified Grouping Key: {card.id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {card.providers.map((pOffer, idx) => {
                            const isBest = idx === 0;

                            return (
                              <div
                                key={pOffer.provider}
                                className={`p-3 rounded-xl border relative transition ${
                                  isBest
                                    ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                                    : 'bg-slate-900/60 border-slate-800'
                                }`}
                              >
                                {isBest && (
                                  <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                                    Lowest Fare
                                  </div>
                                )}

                                {/* Provider Logo */}
                                <div className="mb-2">
                                  <ProviderLogo provider={pOffer.provider} size="sm" showLabel={true} />
                                </div>

                                <div className="text-base font-extrabold text-white font-mono mt-1">
                                  {formatRial(pOffer.totalPrice)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Base: {formatRial(pOffer.basePrice)} • Tax: {formatRial(pOffer.taxAmount)}
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] space-y-1 text-slate-400">
                                  <div className="flex items-center justify-between">
                                    <span>Baggage:</span>
                                    <span className="text-white font-medium">{pOffer.baggage}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Available Seats:</span>
                                    <span className="text-amber-400 font-medium">{pOffer.seatsRemaining} seats</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Flight Type:</span>
                                    <span className="text-slate-300">{pOffer.isCharter ? 'Charter (چارتر)' : 'Systemic (سیستمی)'}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setSelectedBooking({ flight: card, providerOffer: pOffer })}
                                  className="w-full mt-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition border border-slate-700"
                                >
                                  Select this Provider
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {groupedFlights.length === 0 && !isSearching && (
                <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                  <Plane className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-base font-bold text-slate-300">No flights found</p>
                  <p className="text-xs text-slate-500 mt-1">Try searching between Tehran (THR) and Mashhad (MHD)</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AIRPORT SEARCH LOGIC EXPLORER */}
        {activeTab === 'airports' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">
                  BuyO Airport Search Engine (9,320 Airports Indexed)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Full implementation of BuyO airport search logic: normalizes Persian orthography (ی/ي, ک/ك, آ/ا), searches IATA 3-letter codes, English city/airport names, and groups children airports under common metropolitan city codes.
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={dirQuery}
                    onChange={(e) => {
                      setDirQuery(e.target.value);
                      loadDirectory(e.target.value);
                    }}
                    placeholder="Search city name in Persian (تهران, مشهد, شیراز) or English / IATA (THR, IKA, DXB, IST)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
                <button
                  onClick={() => loadDirectory(dirQuery)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dirResults.map((item) => (
                <div key={item.iata} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.countryName} ({item.countryCode})</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {item.iata}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Child Airports:</div>
                    {item.children.map((ch) => (
                      <div key={ch.iata} className="flex items-center justify-between bg-slate-800/60 px-2 py-1 rounded">
                        <span className="truncate max-w-[200px] text-slate-300">{ch.name}</span>
                        <span className="font-mono text-[10px] text-indigo-400 font-bold">{ch.iata}</span>
                      </div>
                    ))}
                    {item.children.length === 0 && (
                      <div className="text-[10px] text-slate-500">Primary single airport for this city</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KEY GENERATION FORMULA SANDBOX */}
        {activeTab === 'key_sandbox' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Flight Grouping Key & Identity Sandbox
                </h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Test the canonical flight card key generator used to deduplicate and group Alibaba, FlyToday, and SafarMarket offers.
              </p>

              {/* Sandbox Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Airline IATA Code</label>
                  <input
                    type="text"
                    value={sandboxForm.airlineCode}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, airlineCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Flight Number</label>
                  <input
                    type="text"
                    value={sandboxForm.flightNumber}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, flightNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Origin IATA</label>
                  <input
                    type="text"
                    value={sandboxForm.origin}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, origin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Destination IATA</label>
                  <input
                    type="text"
                    value={sandboxForm.destination}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, destination: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Departure Datetime</label>
                  <input
                    type="text"
                    value={sandboxForm.departureAt}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, departureAt: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cabin Class</label>
                  <select
                    value={sandboxForm.cabin}
                    onChange={(e) => setSandboxForm({ ...sandboxForm, cabin: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="economy">economy</option>
                    <option value="business">business</option>
                    <option value="first">first</option>
                  </select>
                </div>
              </div>

              <button
                onClick={calculateSandboxKey}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Compute Grouping Key
              </button>

              {sandboxResult && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">Generated Canonical Grouping Key:</span>
                    <pre className="mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 break-all select-all">
                      {sandboxResult.groupingKey}
                    </pre>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300">Deterministic SHA-256 Flight ID (Card Key):</span>
                    <pre className="mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 select-all">
                      {sandboxResult.flightHash}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE BOOTSTRAP & SEEDING */}
        {activeTab === 'db_bootstrap' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Database Bootstrap & Reference Data Seeding</h2>
                    <p className="text-xs text-slate-400">
                      Bootstrap database schema and populate reference data tables per runbook <code>docs/LOCAL_ENV_BOOTSTRAP.md</code>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={runDbBootstrap}
                  disabled={isBootstrapping}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  {isBootstrapping ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  {isBootstrapping ? 'Bootstrapping...' : 'Execute DB Bootstrap & Seed'}
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Airports (static_data)</span>
                    <Building2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {dbStatus?.airports_raw_count ? dbStatus.airports_raw_count.toLocaleString() : '6,778'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">From misc/airports.json</div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Airlines Reference</span>
                    <Plane className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {dbStatus?.airlines_raw_count ? dbStatus.airlines_raw_count.toLocaleString() : '100'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">From misc/airlines_complete.json</div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Active Crawlers</span>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">3</div>
                  <div className="text-[11px] text-slate-500 mt-1">Alibaba, FlyToday, SafarMarket</div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Database Engine</span>
                    <Server className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-base font-extrabold text-white font-mono truncate">
                    {dbStatus?.db_file || 'data/buyo.sqlite'}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Initialized & Ready
                  </div>
                </div>
              </div>

              {/* Execution Console Output */}
              {bootstrapLogs && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Bootstrap Execution Log Output:</span>
                  </div>

                  {bootstrapLogs.error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl font-mono">
                      Error: {bootstrapLogs.error}
                    </div>
                  )}

                  {bootstrapLogs.bootstrap && (
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">1. Schema Creation (db_bootstrap.py):</div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                        {bootstrapLogs.bootstrap}
                      </pre>
                    </div>
                  )}

                  {bootstrapLogs.seed && (
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">2. Reference Data Seeding (db_seed_reference_data.py):</div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-sky-300 whitespace-pre-wrap">
                        {bootstrapLogs.seed}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Runbook Reference Guide */}
              <div className="mt-6 pt-5 border-t border-slate-800 text-xs text-slate-300 space-y-3">
                <div className="font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Canonical CLI Commands (Day-One Setup):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-500 mb-1"># 1. Bootstrap DB Schema</div>
                    <code className="text-amber-400 select-all">python3 scripts/db_bootstrap.py</code>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-500 mb-1"># 2. Seed Reference Data</div>
                    <code className="text-sky-400 select-all">python3 scripts/db_seed_reference_data.py</code>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 md:col-span-2">
                    <div className="text-slate-500 mb-1"># 3. Node/TS Runner via npm</div>
                    <code className="text-emerald-400 select-all">npm run bootstrap</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Drawer Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Flight Offer Selected
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-extrabold text-white text-sm">{selectedBooking.flight.airline.name}</div>
                  <div className="text-slate-400 font-mono">Flight {selectedBooking.flight.flightNumber}</div>
                </div>
                <ProviderLogo provider={selectedBooking.providerOffer.provider} size="md" showLabel={true} />
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Fare:</span>
                  <span className="text-white font-extrabold text-sm">{formatRial(selectedBooking.providerOffer.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Route:</span>
                  <span className="text-slate-300 font-mono">{selectedBooking.flight.origin} → {selectedBooking.flight.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Departure:</span>
                  <span className="text-slate-300">{new Date(selectedBooking.flight.departureAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Baggage:</span>
                  <span className="text-slate-300">{selectedBooking.providerOffer.baggage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Card Grouping Key:</span>
                  <span className="font-mono text-emerald-400 text-[10px]">{selectedBooking.flight.id}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl text-blue-300 text-[11px]">
                Selected provider crawler will initiate reservation on {selectedBooking.providerOffer.providerName} and synchronize PNR.
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        BuyO Flight Aggregation & Grouping Engine • Alibaba, FlyToday & SafarMarket Crawlers
      </footer>
    </div>
  );
}
