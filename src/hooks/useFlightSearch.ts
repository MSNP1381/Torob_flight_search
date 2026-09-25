import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { ProviderType } from '../components/ProviderLogo';
import {
  GroupedFlightCard,
  FlightSortOption,
  AirportOption,
  AirportCity,
  DurationBinFilter,
} from '../types/flight';
import { FlightWeightMatrix, computeFlightScores, PresetProfileName } from '../algo';

export function useFlightSearch(onSearchComplete?: () => void) {
  // Search parameters
  const [origin, setOrigin] = useState<AirportOption>({
    code: 'THR',
    name: 'تهران (مهرآباد / امام خمینی)',
    city: 'تهران',
  });
  const [destination, setDestination] = useState<AirportOption>({
    code: 'MHD',
    name: 'مشهد (شهید هاشمی‌نژاد)',
    city: 'مشهد',
  });
  const [depDate, setDepDate] = useState<Dayjs>(dayjs().add(1, 'day'));
  const [cabin, setCabin] = useState<string>('economy');
  const [selectedProviders, setSelectedProviders] = useState<ProviderType[]>([
    'alibaba',
    'flytoday',
    'safarmarket',
  ]);

  // Autocomplete airport search options
  const [originOptions, setOriginOptions] = useState<{ value: string; label: React.ReactNode; raw: any }[]>([]);
  const [destOptions, setDestOptions] = useState<{ value: string; label: React.ReactNode; raw: any }[]>([]);

  // Search results
  const [isSearching, setIsSearching] = useState(false);
  const [groupedFlights, setGroupedFlights] = useState<GroupedFlightCard[]>([]);
  const [rawOffersCount, setRawOffersCount] = useState(0);

  // Sorting and Filtering
  const [sortBy, setSortBy] = useState<FlightSortOption>('Algorithmic');
  const [selectedDurationBin, setSelectedDurationBin] = useState<DurationBinFilter | null>(null);

  // Algorithmic Weight Matrix State & Personas
  const [selectedAlgoProfile, setSelectedAlgoProfile] = useState<PresetProfileName>('bestDeal');
  const [familyKidsCount, setFamilyKidsCount] = useState<number>(1);
  const [familyAdultsCount, setFamilyAdultsCount] = useState<number>(2);

  const swapOriginDest = useCallback(() => {
    setOrigin((prevOrigin) => {
      setDestination(prevOrigin);
      return destination;
    });
  }, [destination]);

  const setPopularRoute = useCallback((from: AirportOption, to: AirportOption) => {
    setOrigin(from);
    setDestination(to);
  }, []);

  const fetchAirportSuggestions = useCallback(async (q: string, isOrigin: boolean) => {
    if (!q || q.trim().length === 0) return;
    try {
      const res = await fetch(`/api/airports/search?q=${encodeURIComponent(q)}&limit=12`);
      if (res.ok) {
        const data: AirportCity[] = await res.json();
        const options = data.map((item) => ({
          value: item.iata,
          label: `${item.name} (${item.countryName} - ${item.iata})`,
          raw: item,
        }));
        if (isOrigin) {
          setOriginOptions(options);
        } else {
          setDestOptions(options);
        }
      }
    } catch (err) {
      console.error('Failed to search airports:', err);
    }
  }, []);

  const onSearchCompleteRef = React.useRef(onSearchComplete);
  React.useEffect(() => {
    onSearchCompleteRef.current = onSearchComplete;
  }, [onSearchComplete]);

  const performSearch = useCallback(
    async (
      overrideSort?: FlightSortOption,
      customParams?: {
        originCode?: string;
        destCode?: string;
        depDate?: Dayjs;
        cabin?: string;
        providers?: ProviderType[];
      }
    ) => {
      setIsSearching(true);
      try {
        const targetOrigin = customParams?.originCode || origin.code;
        const targetDest = customParams?.destCode || destination.code;
        const targetDate = customParams?.depDate || depDate || dayjs().add(1, 'day');
        const targetCabin = customParams?.cabin || cabin;
        const targetProviders = customParams?.providers || selectedProviders;

        const payload = {
          origin: { code: targetOrigin },
          destination: { code: targetDest },
          departure_date: targetDate.format('YYYY-MM-DD'),
          cabin: targetCabin,
          providers: targetProviders,
        };

        const createRes = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!createRes.ok) throw new Error('Search failed');
        const createData = await createRes.json();
        const sessionId = createData.session_id;

        const currentSort = overrideSort || sortBy;
        const offersRes = await fetch(`/api/search/${sessionId}/offers?sort=${currentSort}`);
        if (offersRes.ok) {
          const offersData = await offersRes.json();
          setGroupedFlights(offersData.grouped_cards || []);
          setRawOffersCount(offersData.raw_offers_count || 0);
          onSearchCompleteRef.current?.();
        }
      } catch (err) {
        console.error('Failed to search flights:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [origin.code, destination.code, depDate, cabin, selectedProviders, sortBy]
  );

  // Algorithmic Weight Matrix based on active profile & family inputs
  const currentWeightMatrix = useMemo(() => {
    switch (selectedAlgoProfile) {
      case 'business':
        return FlightWeightMatrix.business();
      case 'student':
        return FlightWeightMatrix.student();
      case 'family':
        return FlightWeightMatrix.family(familyKidsCount, familyAdultsCount);
      case 'fastest':
        return FlightWeightMatrix.fastest();
      case 'bestDeal':
      default:
        return FlightWeightMatrix.bestDeal();
    }
  }, [selectedAlgoProfile, familyKidsCount, familyAdultsCount]);

  // Scores dictionary: Record<string, number> (card.id -> score [0.0 - 1.0])
  const algorithmicScores = useMemo(() => {
    return computeFlightScores(groupedFlights, currentWeightMatrix);
  }, [groupedFlights, currentWeightMatrix]);

  // Grouped flights sorted by: 'Algorithmic', 'Cheapest', 'Fastest', or 'Earliest'
  const sortedFlights = useMemo(() => {
    // 1. Deduplicate by card id / canonical grouping key
    const uniqueMap = new Map<string, GroupedFlightCard>();
    for (const f of groupedFlights) {
      if (!uniqueMap.has(f.id)) {
        uniqueMap.set(f.id, f);
      } else {
        const existing = uniqueMap.get(f.id)!;
        if (f.bestPrice.totalPrice < existing.bestPrice.totalPrice) {
          uniqueMap.set(f.id, f);
        }
      }
    }
    let list = Array.from(uniqueMap.values());

    // 2. Filter by duration window if selected in histogram
    if (selectedDurationBin) {
      list = list.filter(
        (f) =>
          f.durationMinutes >= selectedDurationBin.minMinutes &&
          f.durationMinutes <= selectedDurationBin.maxMinutes
      );
    }

    // 3. Deterministic sorting with stable tie-breakers
    if (sortBy === 'Algorithmic') {
      return [...list].sort((a, b) => {
        const scoreA = algorithmicScores[a.id] ?? 0;
        const scoreB = algorithmicScores[b.id] ?? 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return a.bestPrice.totalPrice - b.bestPrice.totalPrice;
      });
    }
    if (sortBy === 'Cheapest') {
      return [...list].sort((a, b) => {
        if (a.bestPrice.totalPrice !== b.bestPrice.totalPrice) {
          return a.bestPrice.totalPrice - b.bestPrice.totalPrice;
        }
        return a.durationMinutes - b.durationMinutes;
      });
    }
    if (sortBy === 'Fastest') {
      return [...list].sort((a, b) => {
        if (a.durationMinutes !== b.durationMinutes) {
          return a.durationMinutes - b.durationMinutes;
        }
        return a.bestPrice.totalPrice - b.bestPrice.totalPrice;
      });
    }
    if (sortBy === 'Earliest') {
      return [...list].sort((a, b) => {
        const timeA = new Date(a.departureAt).getTime();
        const timeB = new Date(b.departureAt).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return a.bestPrice.totalPrice - b.bestPrice.totalPrice;
      });
    }
    return list;
  }, [groupedFlights, sortBy, selectedDurationBin, algorithmicScores]);

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

  return {
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
  };
}
