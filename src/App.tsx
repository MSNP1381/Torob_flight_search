import React, { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Alert, Button } from 'antd';
import faIR from 'antd/locale/fa_IR';

// Types
import { GroupedFlightCard, ProviderOffer, SqliteSearchItem } from './types/flight';

// Custom Hooks
import { useThemeMode } from './hooks/useThemeMode';
import { useFlightSearch } from './hooks/useFlightSearch';
import { useSearchHistory } from './hooks/useSearchHistory';
import { useAirportDirectory } from './hooks/useAirportDirectory';
import { useKeySandbox } from './hooks/useKeySandbox';
import { useDbBootstrap } from './hooks/useDbBootstrap';

// Components
import { AppHeader } from './components/header/AppHeader';
import { FlightSearchForm } from './components/search/FlightSearchForm';
import { FlightMetricsBar } from './components/search/FlightMetricsBar';
import { FlightSortToolbar } from './components/search/FlightSortToolbar';
import { FlightResultsList } from './components/search/FlightResultsList';
import { WeightMatrixDrawer } from './components/algo/WeightMatrixDrawer';
import { BookingModal } from './components/booking/BookingModal';
import { SearchHistoryDrawer } from './components/history/SearchHistoryDrawer';
import { AirportExplorerTab } from './components/airports/AirportExplorerTab';
import { KeySandboxTab } from './components/sandbox/KeySandboxTab';
import { DbBootstrapTab } from './components/bootstrap/DbBootstrapTab';
import { AppFooter } from './components/common/AppFooter';
import { DurationHistogram } from './components/DurationHistogram';
import { GroupingKeyModal } from './components/GroupingKeyModal';
import { ProviderSessionManagerModal } from './components/ProviderSessionManagerModal';

// Firebase
import { testFirebaseConnection } from './firebase/config';

const { Content } = Layout;

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('grouped_search');
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  // Theme Management Hook
  const { isDarkMode, toggleTheme, themeConfig } = useThemeMode();

  // SQLite Search History Hook
  const {
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    sqliteSearches,
    isHistoryLoading,
    fetchSqliteHistory,
  } = useSearchHistory();

  // Flight Search & Ranking Hook
  const {
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
    fetchAirportSuggestions,
    swapOriginDest,
    setPopularRoute,
    isSearching,
    groupedFlights,
    rawOffersCount,
    sortBy,
    setSortBy,
    selectedDurationBin,
    setSelectedDurationBin,
    selectedAlgoProfile,
    setSelectedAlgoProfile,
    familyKidsCount,
    setFamilyKidsCount,
    familyAdultsCount,
    setFamilyAdultsCount,
    currentWeightMatrix,
    algorithmicScores,
    sortedFlights,
    minPrice,
    minDuration,
    earliestTime,
    performSearch,
  } = useFlightSearch(() => {
    fetchSqliteHistory();
  });

  // Airport Directory Hook
  const {
    dirQuery,
    setDirQuery,
    dirResults,
    isDirLoading,
    loadDirectory,
  } = useAirportDirectory('تهران');

  // Key Sandbox Hook
  const {
    sandboxForm,
    setSandboxForm,
    sandboxResult,
    calculateSandboxKey,
  } = useKeySandbox();

  // DB Bootstrap Hook
  const {
    dbStatus,
    isBootstrapping,
    bootstrapLogs,
    fetchDbStatus,
    runDbBootstrap,
  } = useDbBootstrap();

  // Modal / Drawer Selection States
  const [inspectingFlight, setInspectingFlight] = useState<GroupedFlightCard | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<{
    flight: GroupedFlightCard;
    providerOffer: ProviderOffer;
  } | null>(null);
  const [isWeightDrawerOpen, setIsWeightDrawerOpen] = useState<boolean>(false);

  // Admin Mode & Provider Sessions
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return (
      urlParams.has('admin') ||
      urlParams.has('dev') ||
      urlParams.has('creds') ||
      localStorage.getItem('buyo_dev_mode') === 'true'
    );
  });
  const [secretClickCount, setSecretClickCount] = useState<number>(0);

  // Hidden admin mode key listener (Ctrl+Shift+C or Alt+Shift+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey || e.altKey) &&
        e.shiftKey &&
        (e.key === 'C' || e.key === 'c' || e.key === 'K' || e.key === 'k')
      ) {
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
    fetchSqliteHistory();
  }, []);

  const handleSelectHistoryItem = (item: SqliteSearchItem) => {
    setOrigin({ code: item.origin, name: item.origin, city: item.origin });
    setDestination({ code: item.destination, name: item.destination, city: item.destination });
    setIsHistoryDrawerOpen(false);
    performSearch(undefined, { originCode: item.origin, destCode: item.destination });
  };

  return (
    <ConfigProvider direction="rtl" locale={faIR} theme={themeConfig}>
      <Layout
        className={`min-h-screen font-sans transition-colors duration-200 ${
          isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
        dir="rtl"
      >
        {/* App Header */}
        <AppHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          firebaseConnected={firebaseConnected}
          historyCount={sqliteSearches.length}
          onOpenHistory={() => {
            fetchSqliteHistory();
            setIsHistoryDrawerOpen(true);
          }}
          isAdminMode={isAdminMode}
          onOpenSessionModal={() => setIsSessionModalOpen(true)}
          onSecretTrigger={handleSecretTrigger}
        />

        {/* Main Content Body */}
        <Content className="max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
          {/* TAB 1: GROUPED FLIGHT SEARCH */}
          {activeTab === 'grouped_search' && (
            <div className="space-y-6">
              {/* Dynamic Flight Search Form */}
              <FlightSearchForm
                isDarkMode={isDarkMode}
                origin={origin}
                setOrigin={setOrigin}
                destination={destination}
                setDestination={setDestination}
                depDate={depDate}
                setDepDate={setDepDate}
                cabin={cabin}
                setCabin={setCabin}
                selectedProviders={selectedProviders}
                setSelectedProviders={setSelectedProviders}
                originOptions={originOptions}
                destOptions={destOptions}
                onSearchAirports={fetchAirportSuggestions}
                onSwap={swapOriginDest}
                onSearch={() => performSearch()}
                isSearching={isSearching}
                onSelectPopularRoute={setPopularRoute}
              />

              {/* Deduplication & Aggregation Metric Bar */}
              <FlightMetricsBar
                isDarkMode={isDarkMode}
                rawOffersCount={rawOffersCount}
                totalUniqueFlights={groupedFlights.length}
                multiProviderCount={groupedFlights.filter((f) => f.providerCount > 1).length}
              />

              {/* Duration Histogram Chart */}
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

              {/* Duration Filter Active Alert */}
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

              {/* Results Sorting Toolbar */}
              <FlightSortToolbar
                isDarkMode={isDarkMode}
                sortBy={sortBy}
                setSortBy={setSortBy}
                selectedAlgoProfile={selectedAlgoProfile}
                setSelectedAlgoProfile={setSelectedAlgoProfile}
                familyKidsCount={familyKidsCount}
                setFamilyKidsCount={setFamilyKidsCount}
                familyAdultsCount={familyAdultsCount}
                setFamilyAdultsCount={setFamilyAdultsCount}
                onOpenWeightDrawer={() => setIsWeightDrawerOpen(true)}
              />

              {/* Flight Results Cards List */}
              <FlightResultsList
                isDarkMode={isDarkMode}
                isSearching={isSearching}
                flights={sortedFlights}
                minPrice={minPrice}
                minDuration={minDuration}
                earliestTime={earliestTime}
                algorithmicScores={algorithmicScores}
                isAlgorithmicSort={sortBy === 'Algorithmic'}
                originCode={origin.code}
                destinationCode={destination.code}
                onInspectKey={(card) => setInspectingFlight(card)}
                onSelectBooking={(flight, offer) =>
                  setSelectedBooking({ flight, providerOffer: offer })
                }
              />
            </div>
          )}

          {/* TAB 2: AIRPORT EXPLORER */}
          {activeTab === 'airports' && (
            <AirportExplorerTab
              isDarkMode={isDarkMode}
              dirQuery={dirQuery}
              setDirQuery={setDirQuery}
              dirResults={dirResults}
              isDirLoading={isDirLoading}
              onSearch={loadDirectory}
            />
          )}

          {/* TAB 3: KEY SANDBOX */}
          {activeTab === 'key_sandbox' && (
            <KeySandboxTab
              isDarkMode={isDarkMode}
              form={sandboxForm}
              setForm={setSandboxForm}
              result={sandboxResult}
              onCalculate={calculateSandboxKey}
            />
          )}

          {/* TAB 4: DATABASE BOOTSTRAP */}
          {activeTab === 'db_bootstrap' && (
            <DbBootstrapTab
              isDarkMode={isDarkMode}
              dbStatus={dbStatus}
              isBootstrapping={isBootstrapping}
              bootstrapLogs={bootstrapLogs}
              onRunBootstrap={runDbBootstrap}
            />
          )}
        </Content>

        {/* Weight Matrix Drawer */}
        <WeightMatrixDrawer
          isOpen={isWeightDrawerOpen}
          onClose={() => setIsWeightDrawerOpen(false)}
          selectedAlgoProfile={selectedAlgoProfile}
          familyAdultsCount={familyAdultsCount}
          familyKidsCount={familyKidsCount}
          currentWeightMatrix={currentWeightMatrix}
        />

        {/* Grouping Key Inspector Modal */}
        <GroupingKeyModal
          isOpen={Boolean(inspectingFlight)}
          onClose={() => setInspectingFlight(null)}
          flightCard={inspectingFlight}
        />

        {/* Booking Confirmation Modal */}
        <BookingModal
          bookingData={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          isDarkMode={isDarkMode}
        />

        {/* SQLite Search History Drawer */}
        <SearchHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          isDarkMode={isDarkMode}
          searches={sqliteSearches}
          isLoading={isHistoryLoading}
          onRefresh={fetchSqliteHistory}
          onSelectSearch={handleSelectHistoryItem}
        />

        {/* Crawler Provider Session Manager Modal */}
        <ProviderSessionManagerModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          isDarkMode={isDarkMode}
        />

        {/* Footer */}
        <AppFooter isDarkMode={isDarkMode} />
      </Layout>
    </ConfigProvider>
  );
}
