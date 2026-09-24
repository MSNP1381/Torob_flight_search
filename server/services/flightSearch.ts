import crypto from 'node:crypto';
import { getAirports, getAirlines, RawAirport, RawAirline } from '../data/airports.js';

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

export type FlightSortOption = 'Fastest' | 'Cheapest' | 'Earliest';

// Generates canonical flight grouping key and deterministic hash
export function generateFlightGroupingKey(params: {
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  cabin?: string;
}): { groupingKey: string; flightHash: string } {
  const cleanAirline = (params.airlineCode || '').trim().toUpperCase();
  const cleanFltNum = (params.flightNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanOrigin = (params.origin || '').trim().toUpperCase();
  const cleanDest = (params.destination || '').trim().toUpperCase();

  const dateObj = new Date(params.departureAt);
  const depMinuteStr = !isNaN(dateObj.getTime())
    ? dateObj.toISOString().slice(0, 16)
    : String(params.departureAt).slice(0, 16);

  const cleanCabin = (params.cabin || 'economy').trim().toLowerCase();

  // Canonical BuyO formula:
  // FLIGHT_<AIRLINE>_<FLIGHT_NUM>_<ORIGIN>_<DESTINATION>_<DEP_TIME>_<CABIN>
  const groupingKey = `FLIGHT_${cleanAirline}_${cleanFltNum}_${cleanOrigin}_${cleanDest}_${depMinuteStr}_${cleanCabin}`;
  const flightHash = crypto.createHash('sha256').update(groupingKey).digest('hex').slice(0, 16);

  return { groupingKey, flightHash };
}

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
    return list.sort((a, b) => a.durationMinutes - b.durationMinutes);
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

// Distance calculation between 2 coordinates (Haversine)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Simple seeded pseudo-random number generator for reproducible flight schedules per route+date
function createPrng(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let s = Math.abs(hash) || 1234567;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Domestic Iranian Airlines catalog
const IRAN_DOMESTIC_AIRLINES = [
  { name: 'Mahan Air', nameFa: 'هواپیمایی ماهان', code: 'IRM', iata: 'W5' },
  { name: 'Iran Air (Homa)', nameFa: 'ایران ایر (هما)', code: 'IRA', iata: 'IR' },
  { name: 'Iran Aseman Airlines', nameFa: 'هواپیمایی آسمان', code: 'IRC', iata: 'EP' },
  { name: 'Zagros Airlines', nameFa: 'هواپیمایی زاگرس', code: 'IZG', iata: 'ZV' },
  { name: 'Kish Air', nameFa: 'هواپیمایی کیش', code: 'IRZ', iata: 'Y9' },
  { name: 'Varesh Airlines', nameFa: 'هواپیمایی وارش', code: 'VRH', iata: 'VR' },
  { name: 'Qeshm Air', nameFa: 'هواپیمایی قشم', code: 'QSM', iata: 'QB' },
  { name: 'ATA Airlines', nameFa: 'هواپیمایی آتا', code: 'TBZ', iata: 'I3' },
  { name: 'Caspian Airlines', nameFa: 'هواپیمایی کاسپین', code: 'CPN', iata: 'RV' },
  { name: 'Taban Air', nameFa: 'هواپیمایی تابان', code: 'TBN', iata: 'HH' },
  { name: 'Sepehran Airlines', nameFa: 'هواپیمایی سپهران', code: 'SHI', iata: 'IS' },
  { name: 'Meraj Airlines', nameFa: 'هواپیمایی معراج', code: 'MRJ', iata: 'JI' },
];

// International Airlines
const INTERNATIONAL_AIRLINES = [
  { name: 'Turkish Airlines', nameFa: 'ترکیش ایرلاینز', code: 'THY', iata: 'TK' },
  { name: 'Emirates', nameFa: 'هواپیمایی امارات', code: 'UAE', iata: 'EK' },
  { name: 'Pegasus Airlines', nameFa: 'پگاسوس ایرلاینز', code: 'PGT', iata: 'PC' },
  { name: 'Qatar Airways', nameFa: 'قطر ایرویز', code: 'QTR', iata: 'QR' },
  { name: 'FlyDubai', nameFa: 'فلای دبی', code: 'FDB', iata: 'FZ' },
  { name: 'Mahan Air', nameFa: 'هواپیمایی ماهان', code: 'IRM', iata: 'W5' },
  { name: 'Iran Air', nameFa: 'ایران ایر', code: 'IRA', iata: 'IR' },
];

let nextSessionId = 5000;
const sessions = new Map<number, SearchSession>();

export function createSearchSession(rawPayload: any): SearchSession {
  nextSessionId += 1;
  const sessionId = nextSessionId;

  // Extract parameters
  const originCode = (
    typeof rawPayload.origin === 'object' ? rawPayload.origin.code : rawPayload.origin || 'THR'
  ).toUpperCase();
  const destCode = (
    typeof rawPayload.destination === 'object' ? rawPayload.destination.code : rawPayload.destination || 'MHD'
  ).toUpperCase();
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

  // Find airports
  const allAirports = getAirports();
  const originApt = allAirports.find((a) => (a.iata_code || '').toUpperCase() === originCode);
  const destApt = allAirports.find((a) => (a.iata_code || '').toUpperCase() === destCode);

  const originName = originApt ? `${originApt.city_fa || originApt.city_en} (${originCode})` : originCode;
  const destinationName = destApt ? `${destApt.city_fa || destApt.city_en} (${destCode})` : destCode;

  // Determine domestic or international
  const isDomestic =
    (!originApt || originApt.country_code === 'IR') &&
    (!destApt || destApt.country_code === 'IR');

  // Compute flight distance & realistic duration
  let distanceKm = 800; // default
  if (originApt?.lat && originApt?.lon && destApt?.lat && destApt?.lon) {
    distanceKm = Math.max(150, getDistanceKm(originApt.lat, originApt.lon, destApt.lat, destApt.lon));
  }

  // Cruise speed 750 km/h + taxi/takeoff/landing buffer
  const baseFlightDurationMin = Math.max(45, Math.round((distanceKm / 750) * 60) + 20);

  // Airline pool selection
  const airlinePool = isDomestic ? IRAN_DOMESTIC_AIRLINES : INTERNATIONAL_AIRLINES;

  // Pricing scale
  const basePricePerKm = isDomestic ? 13500 : 45000;
  const baseFare = Math.round(Math.max(12000000, distanceKm * basePricePerKm));
  const cabinMultiplier = cabin === 'business' ? 2.2 : cabin === 'first' ? 3.5 : 1.0;

  // Seeded PRNG for route + date: Ensures deterministic results for same search, but dynamic across routes/dates!
  const prng = createPrng(`${originCode}-${destCode}-${depDate}-${cabin}`);

  // Generate 6 to 9 realistic scheduled flights throughout the day
  const flightCount = 6 + Math.floor(prng() * 4); // 6, 7, 8 or 9 flights
  const departureSlots = [
    { hour: 5, min: 30 + Math.floor(prng() * 25) },
    { hour: 7, min: 10 + Math.floor(prng() * 30) },
    { hour: 9, min: 15 + Math.floor(prng() * 30) },
    { hour: 11, min: 45 + Math.floor(prng() * 30) },
    { hour: 14, min: 20 + Math.floor(prng() * 25) },
    { hour: 16, min: 40 + Math.floor(prng() * 30) },
    { hour: 19, min: 10 + Math.floor(prng() * 35) },
    { hour: 21, min: 25 + Math.floor(prng() * 30) },
    { hour: 23, min: 5 + Math.floor(prng() * 20) },
  ].slice(0, flightCount);

  let totalRawOffers = 0;
  const groupedCards: GroupedFlightCard[] = [];

  departureSlots.forEach((slot, idx) => {
    // Pick airline deterministically
    const airlineIdx = Math.floor(prng() * airlinePool.length);
    const airline = airlinePool[airlineIdx];

    // Flight number (e.g. W5-1024, IR-452)
    const flightNumDigits = 100 + Math.floor(prng() * 8900);
    const flightNumber = `${airline.iata}-${flightNumDigits}`;

    // Duration variation (+/- 10 minutes)
    const durationOffset = Math.floor((prng() - 0.5) * 20);
    const durationMinutes = Math.max(40, baseFlightDurationMin + durationOffset);
    const durH = Math.floor(durationMinutes / 60);
    const durM = durationMinutes % 60;
    const durationStr = `${durH}h ${durM}m`;

    // Time calculations
    const cleanHour = Math.min(23, Math.max(0, slot.hour + Math.floor(slot.min / 60)));
    const cleanMin = Math.min(59, Math.max(0, slot.min % 60));
    const depDateStr = (depDate && String(depDate).slice(0, 10)) || '2026-06-02';
    const depH = String(cleanHour).padStart(2, '0');
    const depM = String(cleanMin).padStart(2, '0');
    const departureIso = `${depDateStr}T${depH}:${depM}:00Z`;

    // Arrival time
    const depDateObj = new Date(departureIso);
    const validDepTime = isNaN(depDateObj.getTime()) ? Date.now() : depDateObj.getTime();
    const arrDateObj = new Date(validDepTime + durationMinutes * 60 * 1000);
    const arrivalIso = arrDateObj.toISOString();

    const isCharter = prng() > 0.65;
    const stops = !isDomestic && distanceKm > 3500 && prng() > 0.5 ? 1 : 0;

    // Generate canonical BuyO grouping key
    const { groupingKey, flightHash } = generateFlightGroupingKey({
      airlineCode: airline.iata,
      flightNumber,
      origin: originCode,
      destination: destCode,
      departureAt: departureIso,
      cabin,
    });

    // Base fare for this specific flight
    const timeDemandFactor = (slot.hour >= 8 && slot.hour <= 18) ? 1.08 : 0.95;
    const randomVariation = 0.94 + prng() * 0.12;
    const corePrice = Math.round(baseFare * cabinMultiplier * timeDemandFactor * randomVariation);

    // Generate provider offers for requested crawlers
    const providerOffers: ProviderOffer[] = [];

    // Each crawler has slight scraped pricing variation, baggage, and seat inventory
    requestedProviders.forEach((prov) => {
      // Alibaba, FlyToday, SafarMarket slight price differentials
      let provPriceDelta = 1.0;
      if (prov === 'flytoday') provPriceDelta = 0.97 + (prng() * 0.04);
      else if (prov === 'alibaba') provPriceDelta = 0.98 + (prng() * 0.05);
      else if (prov === 'safarmarket') provPriceDelta = 0.96 + (prng() * 0.06);

      // Round to nearest 50,000 Rial
      const totalPrice = Math.round((corePrice * provPriceDelta) / 50000) * 50000;
      const taxAmount = Math.round(totalPrice * 0.09);
      const basePrice = totalPrice - taxAmount;

      const seatsRemaining = 2 + Math.floor(prng() * 8);
      const baggage = isDomestic ? '20 KG Included' : '30 KG Included';

      totalRawOffers += 1;
      providerOffers.push({
        provider: prov,
        providerName: providerNames[prov],
        providerOfferRef: `${prov}-${flightHash}-${flightNumber}`,
        totalPrice,
        basePrice,
        taxAmount,
        currency: 'IRR',
        baggage,
        seatsRemaining,
        cancellationPolicy: isCharter ? 'Charter Rules / Jariemeh' : 'Standard IATA Airline Rules',
        isCharter,
        cabin,
        deepLink: `https://${prov}.com/flights/checkout?flight=${flightNumber}&key=${flightHash}`,
      });
    });

    if (providerOffers.length > 0) {
      providerOffers.sort((a, b) => a.totalPrice - b.totalPrice);
      const bestPrice = providerOffers[0];
      const highestPrice = providerOffers[providerOffers.length - 1];
      const savings = highestPrice.totalPrice - bestPrice.totalPrice;

      groupedCards.push({
        id: flightHash,
        groupingKey,
        airline,
        flightNumber,
        origin: originCode,
        originName,
        destination: destCode,
        destinationName,
        departureAt: departureIso,
        arrivalAt: arrivalIso,
        duration: durationStr,
        durationMinutes,
        stops,
        cabin,
        isDomestic,
        providers: providerOffers,
        providerCount: providerOffers.length,
        bestPrice,
        highestPrice,
        savings,
      });
    }
  });

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

export function getSearchSession(sessionId: number): SearchSession | undefined {
  return sessions.get(sessionId);
}
