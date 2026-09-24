import crypto from 'node:crypto';

export type CrawlerProviderName = 'alibaba' | 'flytoday' | 'safarmarket';

export interface ProviderOffer {
  provider: CrawlerProviderName;
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

export interface GroupedFlightCard {
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

export interface SearchSession {
  id: number;
  status: 'POLLING' | 'COMPLETED' | 'FAILED';
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  tripType: string;
  cabin: string;
  providersRequested: CrawlerProviderName[];
  groupedCards: GroupedFlightCard[];
  rawOffersCount: number;
  createdAt: number;
}

// Generates a canonical flight grouping key and deterministic hash
export function generateFlightGroupingKey(params: {
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  cabin?: string;
}): { groupingKey: string; flightHash: string } {
  // Normalize airline code and flight number: remove hyphens, spaces, uppercase
  const cleanAirline = (params.airlineCode || '').trim().toUpperCase();
  const cleanFltNum = (params.flightNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanOrigin = (params.origin || '').trim().toUpperCase();
  const cleanDest = (params.destination || '').trim().toUpperCase();
  
  // Normalize departure datetime up to minutes (YYYY-MM-DDTHH:mm)
  const dateObj = new Date(params.departureAt);
  const depMinuteStr = !isNaN(dateObj.getTime())
    ? dateObj.toISOString().slice(0, 16)
    : String(params.departureAt).slice(0, 16);

  const cleanCabin = (params.cabin || 'economy').trim().toLowerCase();

  // Canonical formula as specified in architecture and crawler design:
  // FLIGHT_<AIRLINE>_<FLIGHT_NUM>_<ORIGIN>_<DESTINATION>_<DEP_TIME>_<CABIN>
  const groupingKey = `FLIGHT_${cleanAirline}_${cleanFltNum}_${cleanOrigin}_${cleanDest}_${depMinuteStr}_${cleanCabin}`;

  // Deterministic 16-character SHA-256 hex digest
  const flightHash = crypto.createHash('sha256').update(groupingKey).digest('hex').slice(0, 16);

  return { groupingKey, flightHash };
}

export type FlightSortOption = 'Fastest' | 'Cheapest' | 'Earliest';

export function parseDurationMinutes(durationStr: string): number {
  let minutes = 0;
  const hMatch = durationStr.match(/(\d+)\s*h/i);
  const mMatch = durationStr.match(/(\d+)\s*m/i);
  if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
  if (mMatch) minutes += parseInt(mMatch[1], 10);
  return minutes || 85;
}

export function sortFlightCards(
  cards: GroupedFlightCard[],
  sort: FlightSortOption = 'Cheapest'
): GroupedFlightCard[] {
  const list = [...cards];
  if (sort === 'Cheapest') {
    return list.sort((a, b) => a.bestPrice.totalPrice - b.bestPrice.totalPrice);
  }
  if (sort === 'Fastest') {
    return list.sort((a, b) => {
      const durA = parseDurationMinutes(a.duration);
      const durB = parseDurationMinutes(b.duration);
      return durA - durB;
    });
  }
  if (sort === 'Earliest') {
    return list.sort((a, b) => {
      const timeA = new Date(a.departureAt).getTime();
      const timeB = new Date(b.departureAt).getTime();
      return timeA - timeB;
    });
  }
  return list;
}

const SCHEDULES_TEMPLATE = [
  {
    airline: { name: 'Mahan Air', nameFa: 'هواپیمایی ماهان', code: 'IRM', iata: 'W5' },
    flightNumber: 'W5-1024',
    depTime: '06:30',
    arrTime: '07:55',
    duration: '1h 25m',
    isCharter: false,
    providersPrices: {
      flytoday: 16850000,
      safarmarket: 17050000,
      alibaba: 17200000,
    },
    seats: { flytoday: 5, safarmarket: 4, alibaba: 7 },
  },
  {
    airline: { name: 'Iran Air', nameFa: 'ایران ایر (هما)', code: 'IRA', iata: 'IR' },
    flightNumber: 'IR-452',
    depTime: '08:15',
    arrTime: '09:30',
    duration: '1h 15m',
    isCharter: false,
    providersPrices: {
      flytoday: 15900000,
      safarmarket: 16100000,
      alibaba: 16250000,
    },
    seats: { flytoday: 9, safarmarket: 3, alibaba: 5 },
  },
  {
    airline: { name: 'Varesh Airlines', nameFa: 'هواپیمایی وارش', code: 'VRH', iata: 'VR' },
    flightNumber: 'VR-6902',
    depTime: '10:00',
    arrTime: '11:35',
    duration: '1h 35m',
    isCharter: true,
    providersPrices: {
      safarmarket: 16250000,
      flytoday: 16400000,
      alibaba: 16400000,
    },
    seats: { flytoday: 2, safarmarket: 6, alibaba: 4 },
  },
  {
    airline: { name: 'Zagros Airlines', nameFa: 'هواپیمایی زاگرس', code: 'IZG', iata: 'ZV' },
    flightNumber: 'ZV-4011',
    depTime: '13:20',
    arrTime: '14:40',
    duration: '1h 20m',
    isCharter: false,
    providersPrices: {
      alibaba: 15500000,
      safarmarket: 15700000,
      flytoday: 15850000,
    },
    seats: { alibaba: 8, safarmarket: 5, flytoday: 2 },
  },
  {
    airline: { name: 'Iran Aseman Airlines', nameFa: 'هواپیمایی آسمان', code: 'IRC', iata: 'EP' },
    flightNumber: 'EP-3904',
    depTime: '16:45',
    arrTime: '18:15',
    duration: '1h 30m',
    isCharter: false,
    providersPrices: {
      flytoday: 16750000,
      alibaba: 16900000,
    },
    seats: { flytoday: 4, alibaba: 3 },
  },
  {
    airline: { name: 'Qeshm Air', nameFa: 'قشم ایر', code: 'QSM', iata: 'QB' },
    flightNumber: 'QB-1240',
    depTime: '19:30',
    arrTime: '21:10',
    duration: '1h 40m',
    isCharter: true,
    providersPrices: {
      safarmarket: 17300000,
      alibaba: 17450000,
    },
    seats: { safarmarket: 5, alibaba: 6 },
  },
  {
    airline: { name: 'Kish Air', nameFa: 'کیش ایر', code: 'IRZ', iata: 'Y9' },
    flightNumber: 'Y9-7020',
    depTime: '21:40',
    arrTime: '22:50',
    duration: '1h 10m',
    isCharter: false,
    providersPrices: {
      flytoday: 15800000,
      safarmarket: 15850000,
      alibaba: 15950000,
    },
    seats: { flytoday: 7, safarmarket: 8, alibaba: 9 },
  },
];

let nextSessionId = 5000;
const sessions = new Map<number, SearchSession>();

export function createSearchSession(rawPayload: any): SearchSession {
  nextSessionId += 1;
  const sessionId = nextSessionId;

  const originCode = (rawPayload.origin?.code || rawPayload.origin || 'THR').toUpperCase();
  const destCode = (rawPayload.destination?.code || rawPayload.destination || 'MHD').toUpperCase();
  const depDate = rawPayload.departure_date || rawPayload.departureDate || '2026-06-02';
  const retDate = rawPayload.return_date || rawPayload.returnDate || null;
  const tripType = retDate ? 'round_trip' : 'one_way';
  const cabin = rawPayload.cabin || 'economy';

  const requestedProviders: CrawlerProviderName[] =
    rawPayload.providers && Array.isArray(rawPayload.providers) && rawPayload.providers.length > 0
      ? rawPayload.providers
      : ['alibaba', 'flytoday', 'safarmarket'];

  const providerNames: Record<CrawlerProviderName, string> = {
    alibaba: 'Alibaba (علی‌بابا)',
    flytoday: 'FlyToday (فلای‌تودی)',
    safarmarket: 'SafarMarket (سفرمارکت)',
  };

  // Grouping map: groupingKey -> GroupedFlightCard
  const groupedMap = new Map<string, GroupedFlightCard>();
  let totalRawOffers = 0;

  SCHEDULES_TEMPLATE.forEach((sched, schedIdx) => {
    const depIso = `${depDate}T${sched.depTime}:00Z`;
    const arrIso = `${depDate}T${sched.arrTime}:00Z`;

    // 1. Generate canonical grouping key for this physical flight
    const { groupingKey, flightHash } = generateFlightGroupingKey({
      airlineCode: sched.airline.iata,
      flightNumber: sched.flightNumber,
      origin: originCode,
      destination: destCode,
      departureAt: depIso,
      cabin,
    });

    const providerOffers: ProviderOffer[] = [];

    // 2. Iterate through crawlers that carry this flight
    requestedProviders.forEach((prov) => {
      const price = sched.providersPrices[prov as keyof typeof sched.providersPrices];
      if (price !== undefined) {
        totalRawOffers += 1;
        const taxAmount = Math.round(price * 0.09);
        const baseAmount = price - taxAmount;
        const seats = (sched.seats as any)[prov] ?? 4;

        providerOffers.push({
          provider: prov,
          providerName: providerNames[prov],
          providerOfferRef: `${prov}-${flightHash}-${sched.flightNumber}`,
          totalPrice: price,
          basePrice: baseAmount,
          taxAmount,
          currency: 'IRR',
          baggage: sched.isCharter ? '15 KG' : '20 KG',
          seatsRemaining: seats,
          cancellationPolicy: sched.isCharter
            ? 'Charter flight: cancellation fee 80% up to 24h prior'
            : 'Scheduled flight: partial refund according to Iranian Civil Aviation rules',
          isCharter: sched.isCharter,
          cabin,
          deepLink: `https://${prov}.ir/flights/${originCode}-${destCode}/${depDate}`,
        });
      }
    });

    if (providerOffers.length > 0) {
      // Sort offers by price ascending (best deal first)
      providerOffers.sort((a, b) => a.totalPrice - b.totalPrice);
      const bestPrice = providerOffers[0];
      const highestPrice = providerOffers[providerOffers.length - 1];
      const savings = highestPrice.totalPrice - bestPrice.totalPrice;

      groupedMap.set(groupingKey, {
        id: flightHash,
        groupingKey,
        airline: sched.airline,
        flightNumber: sched.flightNumber,
        origin: originCode,
        destination: destCode,
        departureAt: depIso,
        arrivalAt: arrIso,
        duration: sched.duration,
        stops: 0,
        cabin,
        isDomestic: true,
        providers: providerOffers,
        providerCount: providerOffers.length,
        bestPrice,
        highestPrice,
        savings,
      });
    }
  });

  const groupedCards = Array.from(groupedMap.values()).sort(
    (a, b) => a.bestPrice.totalPrice - b.bestPrice.totalPrice
  );

  const session: SearchSession = {
    id: sessionId,
    status: 'COMPLETED',
    origin: originCode,
    destination: destCode,
    departureDate: depDate,
    returnDate: retDate,
    tripType,
    cabin,
    providersRequested: requestedProviders,
    groupedCards,
    rawOffersCount: totalRawOffers,
    createdAt: Date.now(),
  };

  sessions.set(sessionId, session);
  return session;
}

export function getSearchSession(sessionId: number): SearchSession | null {
  return sessions.get(sessionId) || null;
}
