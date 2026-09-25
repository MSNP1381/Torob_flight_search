/**
 * Real Provider Live Integration Service
 * Executes live search queries against Alibaba (ws.alibaba.ir), FlyToday (flytoday.ir), and SafarMarket (safarmarket.com).
 * Uses local proxy http://127.0.0.1:2080 to query providers securely.
 * Tracks per-provider progress, timing, and completion status.
 */

import https from 'node:https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ProviderSessionService, ProviderSessionData } from './providerSessions.js';
import {
  ProviderOffer,
  GroupedFlightCard,
  generateFlightGroupingKey,
  CrawlerProviderName,
  ProviderProgressStatus,
} from './flightSearch.js';
import { IranProxyService } from './iranProxyService.js';
import { sqliteService } from './sqliteDb.js';
import { getAirports, getAirlines } from '../data/airports.js';

export interface LiveProviderSearchResult {
  provider: CrawlerProviderName;
  status: 'LIVE_FETCH_SUCCESS' | 'SESSION_MISSING' | 'SESSION_EXPIRED' | 'LIVE_BLOCKED' | 'FAILED';
  offers: ProviderOffer[];
  rawCount: number;
  message?: string;
  latencyMs: number;
  proxyUsed?: string;
}

export interface LiveMultiProviderResult {
  groupedCards: GroupedFlightCard[];
  rawOffersCount: number;
  providerStatus: Record<string, string>;
  providerProgress: Record<CrawlerProviderName, ProviderProgressStatus>;
  completedProvidersCount: number;
  totalProvidersCount: number;
  isAllFinished: boolean;
}

export interface ParsedLiveItem {
  offer: ProviderOffer;
  rawFlightNumber: string;
  airlineCode: string;
  departureIso: string;
  arrivalIso: string;
  durationStr: string;
  durationMinutes: number;
}

export interface ProviderParseResult {
  offers: ProviderOffer[];
  items: ParsedLiveItem[];
  groupingKeyMap: Map<string, ProviderOffer>;
  rawCount: number;
}

const AIRLINE_CATALOG: Record<string, { name: string; nameFa: string; code: string; iata: string }> = {
  W5: { name: 'Mahan Air', nameFa: 'هواپیمایی ماهان', code: 'IRM', iata: 'W5' },
  IRM: { name: 'Mahan Air', nameFa: 'هواپیمایی ماهان', code: 'IRM', iata: 'W5' },
  IR: { name: 'Iran Air (Homa)', nameFa: 'ایران ایر (هما)', code: 'IRA', iata: 'IR' },
  IRA: { name: 'Iran Air (Homa)', nameFa: 'ایران ایر (هما)', code: 'IRA', iata: 'IR' },
  IRC: { name: 'Iran Aseman Airlines', nameFa: 'هواپیمایی آسمان', code: 'IRC', iata: 'EP' },
  EP: { name: 'Iran Aseman Airlines', nameFa: 'هواپیمایی آسمان', code: 'IRC', iata: 'EP' },
  VR: { name: 'Varesh Airlines', nameFa: 'هواپیمایی وارش', code: 'VRH', iata: 'VR' },
  VRH: { name: 'Varesh Airlines', nameFa: 'هواپیمایی وارش', code: 'VRH', iata: 'VR' },
  B9: { name: 'Iran Airtour', nameFa: 'هواپیمایی ایران ایرتور', code: 'IRB', iata: 'B9' },
  IRB: { name: 'Iran Airtour', nameFa: 'هواپیمایی ایران ایرتور', code: 'IRB', iata: 'B9' },
  I3: { name: 'ATA Airlines', nameFa: 'هواپیمایی آتا', code: 'TBZ', iata: 'I3' },
  TBZ: { name: 'ATA Airlines', nameFa: 'هواپیمایی آتا', code: 'TBZ', iata: 'I3' },
  ZV: { name: 'Zagros Airlines', nameFa: 'هواپیمایی زاگرس', code: 'IZG', iata: 'ZV' },
  IZG: { name: 'Zagros Airlines', nameFa: 'هواپیمایی زاگرس', code: 'IZG', iata: 'ZV' },
  Y9: { name: 'Kish Air', nameFa: 'هواپیمایی کیش', code: 'IRZ', iata: 'Y9' },
  IRZ: { name: 'Kish Air', nameFa: 'هواپیمایی کیش', code: 'IRZ', iata: 'Y9' },
  QB: { name: 'Qeshm Air', nameFa: 'هواپیمایی قشم', code: 'QSM', iata: 'QB' },
  QSM: { name: 'Qeshm Air', nameFa: 'هواپیمایی قشم', code: 'QSM', iata: 'QB' },
  RV: { name: 'Caspian Airlines', nameFa: 'هواپیمایی کاسپین', code: 'CPN', iata: 'RV' },
  CPN: { name: 'Caspian Airlines', nameFa: 'هواپیمایی کاسپین', code: 'CPN', iata: 'RV' },
  HH: { name: 'Taban Air', nameFa: 'هواپیمایی تابان', code: 'TBN', iata: 'HH' },
  TBN: { name: 'Taban Air', nameFa: 'هواپیمایی تابان', code: 'TBN', iata: 'HH' },
  IS: { name: 'Sepehran Airlines', nameFa: 'هواپیمایی سپهران', code: 'SHI', iata: 'IS' },
  SHI: { name: 'Sepehran Airlines', nameFa: 'هواپیمایی سپهران', code: 'SHI', iata: 'IS' },
  JI: { name: 'Meraj Airlines', nameFa: 'هواپیمایی معراج', code: 'MRJ', iata: 'JI' },
  MRJ: { name: 'Meraj Airlines', nameFa: 'هواپیمایی معراج', code: 'MRJ', iata: 'JI' },
  NV: { name: 'Karun Airlines', nameFa: 'هواپیمایی کارون', code: 'IRK', iata: 'NV' },
  IRK: { name: 'Karun Airlines', nameFa: 'هواپیمایی کارون', code: 'IRK', iata: 'NV' },
  PA: { name: 'Pars Air', nameFa: 'هواپیمایی پارس ایر', code: 'PRS', iata: 'PA' },
  PRS: { name: 'Pars Air', nameFa: 'هواپیمایی پارس ایر', code: 'PRS', iata: 'PA' },
  PY: { name: 'Pouya Air', nameFa: 'هواپیمایی پویا', code: 'PYA', iata: 'PY' },
  PYA: { name: 'Pouya Air', nameFa: 'هواپیمایی پویا', code: 'PYA', iata: 'PY' },
  AA: { name: 'Ava Air', nameFa: 'هواپیمایی آوا ایر', code: 'FPA', iata: 'AA' },
  FPA: { name: 'Ava Air', nameFa: 'هواپیمایی آوا ایر', code: 'FPA', iata: 'AA' },
  NA: { name: 'Nasim Air', nameFa: 'هواپیمایی نسیم ایر', code: 'NSN', iata: 'NA' },
  NSN: { name: 'Nasim Air', nameFa: 'هواپیمایی نسیم ایر', code: 'NSN', iata: 'NA' },
  SA: { name: 'Saha Airlines', nameFa: 'هواپیمایی ساها', code: 'IRG', iata: 'SA' },
  IRG: { name: 'Saha Airlines', nameFa: 'هواپیمایی ساها', code: 'IRG', iata: 'SA' },
  CW: { name: 'Chabahar Airlines', nameFa: 'هواپیمایی چابهار', code: 'CHB', iata: 'CW' },
  TB: { name: 'Yazd Airways', nameFa: 'هواپیمایی یزد', code: 'DZW', iata: 'TB' },
};

function getProxyAgent(): HttpsProxyAgent<string> | undefined {
  const activeProxy = IranProxyService.getActiveProxy();
  const proxyUrl = activeProxy?.url || 'http://127.0.0.1:2080';
  try {
    return new HttpsProxyAgent(proxyUrl);
  } catch (err) {
    console.warn('[LiveIntegration] Proxy initialization warning:', err);
    return undefined;
  }
}

function requestJson(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    timeoutMs?: number;
    useProxy?: boolean;
  }
): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const agent = options.useProxy !== false ? getProxyAgent() : undefined;

    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: options.method || 'GET',
        agent,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(options.headers || {}),
        },
        timeout: options.timeoutMs || 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 120)}`));
            }
            const json = JSON.parse(data);
            resolve(json);
          } catch (e: any) {
            reject(new Error(`Invalid JSON (HTTP ${res.statusCode}): ${data.slice(0, 120)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

function resolveAirline(codeOrIata: string): { name: string; nameFa: string; code: string; iata: string } {
  const clean = (codeOrIata || '').trim().toUpperCase();
  if (AIRLINE_CATALOG[clean]) {
    return AIRLINE_CATALOG[clean];
  }
  const allAirlines = getAirlines();
  const matched = allAirlines.find((al) => al.iata === clean || al.icao === clean);
  if (matched) {
    return {
      name: matched.name_en || matched.name_fa || clean,
      nameFa: matched.name_fa || matched.name_en || clean,
      code: matched.icao || clean,
      iata: matched.iata || clean,
    };
  }
  return {
    name: clean,
    nameFa: clean,
    code: clean,
    iata: clean,
  };
}

export class LiveProviderIntegration {
  /**
   * Search single provider
   */
  static async searchProvider(
    provider: CrawlerProviderName,
    origin: string,
    destination: string,
    departureDate: string,
    cabin: string = 'economy'
  ): Promise<LiveProviderSearchResult> {
    const startTime = Date.now();
    const res = await this.searchLiveFlights({
      origin,
      destination,
      departureDate,
      cabin,
      providers: [provider],
    });
    const offers = res.groupedCards.flatMap((c) => c.providers.filter((p) => p.provider === provider));
    return {
      provider,
      status: res.providerStatus[provider] === 'LIVE_FETCH_SUCCESS' ? 'LIVE_FETCH_SUCCESS' : 'FAILED',
      offers,
      rawCount: offers.length,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Execute real live search query across requested providers (Alibaba, FlyToday, SafarMarket).
   * Queries providers concurrently and tracks individual progress.
   */
  static async searchLiveFlights(params: {
    origin: string;
    destination: string;
    departureDate: string;
    cabin?: string;
    providers?: CrawlerProviderName[];
  }): Promise<LiveMultiProviderResult> {
    const origin = params.origin.toUpperCase();
    const destination = params.destination.toUpperCase();
    const departureDate = params.departureDate;
    const cabin = params.cabin || 'economy';
    const requestedProviders = params.providers && params.providers.length > 0
      ? params.providers
      : ['alibaba', 'flytoday', 'safarmarket'];

    const providerStatus: Record<string, string> = {};
    const providerProgress: Record<CrawlerProviderName, ProviderProgressStatus> = {
      alibaba: {
        status: 'PENDING',
        offersCount: 0,
        durationMs: 0,
        isFinished: false,
        updatedAt: new Date().toISOString(),
      },
      flytoday: {
        status: 'PENDING',
        offersCount: 0,
        durationMs: 0,
        isFinished: false,
        updatedAt: new Date().toISOString(),
      },
      safarmarket: {
        status: 'PENDING',
        offersCount: 0,
        durationMs: 0,
        isFinished: false,
        updatedAt: new Date().toISOString(),
      },
    };

    // Mark requested providers as IN_PROGRESS
    for (const p of requestedProviders) {
      providerProgress[p].status = 'IN_PROGRESS';
      providerProgress[p].message = 'در حال ارسال درخواست و واکشی بلیت‌ها...';
    }

    const tasks: Promise<void>[] = [];

    // 1. Query Alibaba Live
    let alibabaOffers: ProviderParseResult = {
      offers: [],
      items: [],
      groupingKeyMap: new Map(),
      rawCount: 0,
    };

    if (requestedProviders.includes('alibaba')) {
      tasks.push(
        (async () => {
          const t0 = Date.now();
          try {
            const aliResult = await LiveProviderIntegration.queryAlibabaLive(origin, destination, departureDate, cabin);
            providerStatus['alibaba'] = aliResult.status;
            const durationMs = Date.now() - t0;
            if (aliResult.rawFlights && aliResult.rawFlights.length > 0) {
              alibabaOffers = LiveProviderIntegration.parseAlibabaFlights(aliResult.rawFlights, origin, destination, departureDate, cabin);
              providerProgress.alibaba = {
                status: 'COMPLETED',
                offersCount: alibabaOffers.rawCount,
                durationMs,
                message: `${alibabaOffers.rawCount} پرواز واقعی علی‌بابا واکشی شد`,
                isFinished: true,
                updatedAt: new Date().toISOString(),
              };
            } else {
              providerProgress.alibaba = {
                status: 'COMPLETED',
                offersCount: 0,
                durationMs,
                message: 'هیچ پروازی برای این تاریخ در علی‌بابا یافت نشد',
                isFinished: true,
                updatedAt: new Date().toISOString(),
              };
            }
          } catch (err: any) {
            console.warn('[LiveIntegration] Alibaba live error:', err.message);
            providerStatus['alibaba'] = `ERROR_${err.message}`;
            providerProgress.alibaba = {
              status: 'FAILED',
              offersCount: 0,
              durationMs: Date.now() - t0,
              message: `خطای علی‌بابا: ${err.message}`,
              isFinished: true,
              updatedAt: new Date().toISOString(),
            };
          }
        })()
      );
    }

    // 2. Query FlyToday Live
    let flytodayOffers: ProviderParseResult = {
      offers: [],
      items: [],
      groupingKeyMap: new Map(),
      rawCount: 0,
    };

    if (requestedProviders.includes('flytoday')) {
      tasks.push(
        (async () => {
          const t0 = Date.now();
          try {
            const ftResult = await LiveProviderIntegration.queryFlyTodayLive(origin, destination, departureDate, cabin);
            providerStatus['flytoday'] = ftResult.status;
            const durationMs = Date.now() - t0;
            if (ftResult.itineraries && ftResult.itineraries.length > 0) {
              flytodayOffers = LiveProviderIntegration.parseFlyTodayItineraries(ftResult.itineraries, origin, destination, departureDate, cabin);
              providerProgress.flytoday = {
                status: 'COMPLETED',
                offersCount: flytodayOffers.rawCount,
                durationMs,
                message: `${flytodayOffers.rawCount} پرواز واقعی فلای‌تودی واکشی شد`,
                isFinished: true,
                updatedAt: new Date().toISOString(),
              };
            } else {
              providerProgress.flytoday = {
                status: 'COMPLETED',
                offersCount: 0,
                durationMs,
                message: 'هیچ پروازی برای این تاریخ در فلای‌تودی یافت نشد',
                isFinished: true,
                updatedAt: new Date().toISOString(),
              };
            }
          } catch (err: any) {
            console.warn('[LiveIntegration] FlyToday live error:', err.message);
            providerStatus['flytoday'] = `ERROR_${err.message}`;
            providerProgress.flytoday = {
              status: 'FAILED',
              offersCount: 0,
              durationMs: Date.now() - t0,
              message: `خطای فلای‌تودی: ${err.message}`,
              isFinished: true,
              updatedAt: new Date().toISOString(),
            };
          }
        })()
      );
    }

    // 3. Query SafarMarket Live
    let safarmarketOffers: ProviderParseResult = {
      offers: [],
      items: [],
      groupingKeyMap: new Map(),
      rawCount: 0,
    };

    if (requestedProviders.includes('safarmarket')) {
      tasks.push(
        (async () => {
          const t0 = Date.now();
          try {
            const smResult = await LiveProviderIntegration.querySafarMarketLive(origin, destination, departureDate, cabin);
            providerStatus['safarmarket'] = smResult.status;
            const durationMs = Date.now() - t0;
            if (smResult.flights && smResult.flights.length > 0) {
              safarmarketOffers = LiveProviderIntegration.parseSafarMarketFlights(smResult.flights, origin, destination, departureDate, cabin);
              providerProgress.safarmarket = {
                status: 'COMPLETED',
                offersCount: safarmarketOffers.rawCount,
                durationMs,
                message: `${safarmarketOffers.rawCount} پرواز واقعی سفرمارکت واکشی شد`,
                isFinished: true,
                updatedAt: new Date().toISOString(),
              };
            } else {
              providerProgress.safarmarket = {
                status: 'COMPLETED',
                offersCount: 0,
                durationMs,
                message: 'هیچ پروازی برای این تاریخ در سفرمارکت یافت نشد',
                isFinished: true,
                updatedAt: new Date().toISOString(),
              };
            }
          } catch (err: any) {
            console.warn('[LiveIntegration] SafarMarket live error:', err.message);
            providerStatus['safarmarket'] = `ERROR_${err.message}`;
            providerProgress.safarmarket = {
              status: 'FAILED',
              offersCount: 0,
              durationMs: Date.now() - t0,
              message: `خطای سفرمارکت: ${err.message}`,
              isFinished: true,
              updatedAt: new Date().toISOString(),
            };
          }
        })()
      );
    }

    // Run all provider queries concurrently
    await Promise.allSettled(tasks);

    // Build unified grouped flight cards merging all providers
    const groupedCards = LiveProviderIntegration.unifyLiveOffers({
      origin,
      destination,
      departureDate,
      cabin,
      alibabaOffers,
      flytodayOffers,
      safarmarketOffers,
    });

    const rawOffersCount = alibabaOffers.rawCount + flytodayOffers.rawCount + safarmarketOffers.rawCount;
    const completedProvidersCount = requestedProviders.filter((p) => providerProgress[p].isFinished).length;

    return {
      groupedCards,
      rawOffersCount,
      providerStatus,
      providerProgress,
      completedProvidersCount,
      totalProvidersCount: requestedProviders.length,
      isAllFinished: true,
    };
  }

  /**
   * 1. Alibaba Live API
   */
  private static async queryAlibabaLive(
    origin: string,
    destination: string,
    departureDate: string,
    cabin: string = 'economy'
  ): Promise<{ status: string; rawFlights: any[] }> {
    const initUrl = 'https://ws.alibaba.ir/api/v1/flights/domestic/available';
    const headers: Record<string, string> = {
      Origin: 'https://www.alibaba.ir',
      Referer: 'https://www.alibaba.ir/',
    };

    const session = await ProviderSessionService.getActiveSession('alibaba');
    if (session && session.cookies && session.cookies.includes('TS01')) {
      headers['Cookie'] = session.cookies;
    }

    const payload = {
      origin,
      destination,
      departureDate,
      adult: 1,
    };

    let initData: any;
    try {
      initData = await requestJson(initUrl, { method: 'POST', headers, body: payload, timeoutMs: 12000 });
    } catch (err: any) {
      // Retry without cookie if forbidden
      delete headers['Cookie'];
      initData = await requestJson(initUrl, { method: 'POST', headers, body: payload, timeoutMs: 12000 });
    }

    const requestId = initData?.result?.requestId;
    if (!requestId) {
      return { status: 'NO_REQUEST_ID', rawFlights: [] };
    }

    // Poll for flights
    const pollUrl = `${initUrl}/${requestId}`;
    const pollData = await requestJson(pollUrl, { method: 'GET', headers, timeoutMs: 12000 });
    const departing = pollData?.result?.departing;

    if (Array.isArray(departing)) {
      return {
        status: 'LIVE_FETCH_SUCCESS',
        rawFlights: departing,
      };
    }

    return { status: 'EMPTY_RESULTS', rawFlights: [] };
  }

  /**
   * 2. FlyToday Live API
   */
  private static async queryFlyTodayLive(
    origin: string,
    destination: string,
    departureDate: string,
    cabin: string = 'economy'
  ): Promise<{ status: string; itineraries: any[] }> {
    const url = 'https://www.flytoday.ir/api/gateway/V1/flight/search';
    const payload = {
      pricingSourceType: 0,
      adultCount: 1,
      childCount: 0,
      infantCount: 0,
      travelPreference: {
        cabinType: cabin === 'business' ? 'C' : cabin === 'first' ? 'F' : 'Y',
        maxStopsQuantity: 'All',
        airTripType: 'OneWay',
      },
      originDestinationInformations: [
        {
          departureDateTime: `${departureDate}T00:00:00`,
          destinationLocationCode: destination,
          destinationType: 'City',
          originLocationCode: origin,
          originType: 'City',
        },
      ],
      isJalali: false,
    };

    const headers: Record<string, string> = {
      Origin: 'https://www.flytoday.ir',
      Referer: `https://www.flytoday.ir/flight/search?origin=${origin}&destination=${destination}&departureDate=${departureDate}`,
    };

    const data = await requestJson(url, { method: 'POST', headers, body: payload, timeoutMs: 15000 });
    const itins = data?.pricedItineraries;

    if (Array.isArray(itins)) {
      return {
        status: 'LIVE_FETCH_SUCCESS',
        itineraries: itins,
      };
    }

    return { status: 'EMPTY_RESULTS', itineraries: [] };
  }

  /**
   * 3. SafarMarket Live API
   */
  private static async querySafarMarketLive(
    origin: string,
    destination: string,
    departureDate: string,
    cabin: string = 'economy'
  ): Promise<{ status: string; flights: any[] }> {
    const url = 'https://safarmarket.com/api/flight/v3/search';
    const payload = {
      platform: 'WEB_DESKTOP',
      uid: '',
      limit: 100,
      compress: false,
      productType: 'LFLI',
      searchValidity: 2,
      cid: 1,
      checksum: 1,
      IPInfo: {},
      searchFilter: {
        sourceAirportCode: origin,
        targetAirportCode: destination,
        sourceIsCity: true,
        targetIsCity: true,
        leaveDate: departureDate,
        returnDate: '',
        adultCount: 1,
        childCount: 0,
        infantCount: 0,
        economy: cabin !== 'business' && cabin !== 'first',
        business: cabin === 'business' || cabin === 'first',
        maxStopsQuantity: 'All',
        isJalali: false,
      },
    };

    const headers: Record<string, string> = {
      Origin: 'https://safarmarket.com',
      Referer: `https://safarmarket.com/flights/c${origin}-c${destination}/${departureDate}/0/allclasses/1adults/0children/0infants`,
    };

    const data = await requestJson(url, { method: 'POST', headers, body: payload, timeoutMs: 15000 });
    const flights = data?.result?.flights;

    if (Array.isArray(flights)) {
      return {
        status: 'LIVE_FETCH_SUCCESS',
        flights,
      };
    }

    return { status: 'EMPTY_RESULTS', flights: [] };
  }

  private static parseIsoDateWithTehranTz(dtStr: any, fallbackDate: string, defaultTime: string = '08:00'): string {
    if (!dtStr || typeof dtStr !== 'string') {
      return `${fallbackDate}T${defaultTime}:00+03:30`;
    }
    let s = dtStr.trim().replace(' ', 'T');
    // Check if it's just "HH:mm" or "HH:mm:ss"
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(':');
      const hh = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const ss = parts[2] ? parts[2].padStart(2, '0') : '00';
      return `${fallbackDate}T${hh}:${mm}:${ss}+03:30`;
    }
    // If it ends with Z or has timezone offset e.g. +03:30 or +00:00
    if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) {
      return s;
    }
    // If it's "YYYY-MM-DDTHH:mm(:ss)?" without timezone, append Iran Standard Time (+03:30)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
      if (s.length === 16) s = `${s}:00`;
      return `${s}+03:30`;
    }
    return `${fallbackDate}T${defaultTime}:00+03:30`;
  }

  private static calculateFlightDuration(
    depIso: string,
    arrIso: string,
    explicitMinutes?: number
  ): { durationStr: string; durationMinutes: number } {
    let minutes = explicitMinutes && explicitMinutes > 0 ? explicitMinutes : 0;
    if (!minutes) {
      const depMs = new Date(depIso).getTime();
      const arrMs = new Date(arrIso).getTime();
      if (!isNaN(depMs) && !isNaN(arrMs) && arrMs > depMs) {
        minutes = Math.round((arrMs - depMs) / 60000);
      }
    }
    if (!minutes || minutes <= 0) {
      minutes = 85;
    }
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    const durationStr = hours > 0 ? `${hours}h ${remMin}m` : `${remMin}m`;
    return { durationStr, durationMinutes: minutes };
  }

  /**
   * Parse Alibaba flight items
   */
  private static parseAlibabaFlights(
    rawFlights: any[],
    origin: string,
    destination: string,
    departureDate: string,
    cabin: string
  ): ProviderParseResult {
    const offers: ProviderOffer[] = [];
    const items: ParsedLiveItem[] = [];
    const groupingKeyMap = new Map<string, ProviderOffer>();

    for (const f of rawFlights) {
      const fltNumRaw = String(f.flightNumber || '').replace(/^[^0-9]+/, '');
      const airlineCodeRaw = String(f.airlineCode || '').trim().toUpperCase();
      const airline = resolveAirline(airlineCodeRaw);
      const flightNumber = `${airline.iata}-${fltNumRaw}`;

      const departureIso = LiveProviderIntegration.parseIsoDateWithTehranTz(f.leaveDateTime, departureDate, '08:00');
      const arrivalIso = LiveProviderIntegration.parseIsoDateWithTehranTz(f.arrivalDateTime, departureDate, '09:30');
      const explicitDuration = typeof f.duration === 'number' && f.duration > 0 ? f.duration : undefined;
      const { durationStr, durationMinutes } = LiveProviderIntegration.calculateFlightDuration(departureIso, arrivalIso, explicitDuration);

      const { flightHash } = generateFlightGroupingKey({
        airlineCode: airline.iata,
        flightNumber,
        origin,
        destination,
        departureAt: departureIso,
        cabin,
      });

      const totalPrice = Number(f.priceAdult || f.price || 0);
      const isCharter = Boolean(f.isCharter);
      const seatsRemaining = Number(f.seat || 5);
      const baggage = f.maxAllowedBaggage ? `${f.maxAllowedBaggage} کیلوگرم` : '۲۰ کیلوگرم';
      const basePrice = Math.round(totalPrice * 0.91);
      const taxAmount = totalPrice - basePrice;

      const offer: ProviderOffer = {
        provider: 'alibaba',
        providerName: 'Alibaba (علی‌بابا)',
        providerOfferRef: `ali-${flightHash}-${fltNumRaw}`,
        totalPrice,
        basePrice,
        taxAmount,
        currency: 'IRR',
        baggage,
        seatsRemaining,
        cancellationPolicy: isCharter ? 'چارتر - استرداد منوط به شرایط چارترکننده' : 'سیستمی - طبق مقررات هواپیمایی کشوری',
        isCharter,
        cabin,
        deepLink: f.proposalId
          ? `https://www.alibaba.ir/flights/checkout?proposalId=${f.proposalId}`
          : `https://www.alibaba.ir/flights/${origin}-${destination}?departing=${departureDate}`,
      };

      offers.push(offer);
      items.push({
        offer,
        rawFlightNumber: fltNumRaw,
        airlineCode: airline.iata,
        departureIso,
        arrivalIso,
        durationStr,
        durationMinutes,
      });

      const matchKey = `${airline.iata}_${fltNumRaw}`;
      groupingKeyMap.set(matchKey, offer);
      groupingKeyMap.set(flightHash, offer);
    }

    return { offers, items, groupingKeyMap, rawCount: offers.length };
  }

  /**
   * Parse FlyToday flight items
   */
  private static parseFlyTodayItineraries(
    itineraries: any[],
    origin: string,
    destination: string,
    departureDate: string,
    cabin: string
  ): ProviderParseResult {
    const offers: ProviderOffer[] = [];
    const items: ParsedLiveItem[] = [];
    const groupingKeyMap = new Map<string, ProviderOffer>();

    for (const itin of itineraries) {
      const seg = itin.originDestinationOptions?.[0]?.flightSegments?.[0];
      if (!seg) continue;

      const fltNumRaw = String(seg.flightNumber || '').replace(/^[^0-9]+/, '');
      const airlineCodeRaw = String(seg.marketingAirlineCode || seg.operatingAirline?.code || '').trim().toUpperCase();
      const airline = resolveAirline(airlineCodeRaw);
      const flightNumber = `${airline.iata}-${fltNumRaw}`;

      const departureIso = LiveProviderIntegration.parseIsoDateWithTehranTz(seg.departureDateTime, departureDate, '08:00');
      const arrivalIso = LiveProviderIntegration.parseIsoDateWithTehranTz(seg.arrivalDateTime, departureDate, '09:30');
      const explicitDuration = Number(seg.journeyDurationPerMinute) || undefined;
      const { durationStr, durationMinutes } = LiveProviderIntegration.calculateFlightDuration(departureIso, arrivalIso, explicitDuration);

      const { flightHash } = generateFlightGroupingKey({
        airlineCode: airline.iata,
        flightNumber,
        origin,
        destination,
        departureAt: departureIso,
        cabin,
      });

      const fareInfo = itin.airItineraryPricingInfo?.itinTotalFare;
      const totalPrice = Number(fareInfo?.totalFare || fareInfo?.grandTotalWithoutDiscount || fareInfo?.totalBaseFare || 0);
      if (totalPrice <= 0) continue;

      const isCharter = Boolean(itin.isCharter || seg.isCharter);
      const seatsRemaining = Number(seg.seatsRemaining || 5);
      const baggage = seg.baggageLocal || seg.baggage || '۲۰ کیلوگرم';
      const basePrice = Math.round(totalPrice * 0.91);
      const taxAmount = totalPrice - basePrice;

      const offer: ProviderOffer = {
        provider: 'flytoday',
        providerName: 'FlyToday (فلای‌تودی)',
        providerOfferRef: `ft-${flightHash}-${fltNumRaw}`,
        totalPrice,
        basePrice,
        taxAmount,
        currency: 'IRR',
        baggage,
        seatsRemaining,
        cancellationPolicy: isCharter ? 'چارتر - کنسلی طبق قوانین چارترکننده' : 'سیستمی - قابل استرداد',
        isCharter,
        cabin,
        deepLink: `https://www.flytoday.ir/flight/search?origin=${origin}&destination=${destination}&departureDate=${departureDate}`,
      };

      offers.push(offer);
      items.push({
        offer,
        rawFlightNumber: fltNumRaw,
        airlineCode: airline.iata,
        departureIso,
        arrivalIso,
        durationStr,
        durationMinutes,
      });

      const matchKey = `${airline.iata}_${fltNumRaw}`;
      groupingKeyMap.set(matchKey, offer);
      groupingKeyMap.set(flightHash, offer);
    }

    return { offers, items, groupingKeyMap, rawCount: offers.length };
  }

  /**
   * Parse SafarMarket flight items
   */
  private static parseSafarMarketFlights(
    flights: any[],
    origin: string,
    destination: string,
    departureDate: string,
    cabin: string
  ): ProviderParseResult {
    const offers: ProviderOffer[] = [];
    const items: ParsedLiveItem[] = [];
    const groupingKeyMap = new Map<string, ProviderOffer>();

    for (const f of flights) {
      const leave = f.leave || {};
      const fltNumRaw = String(leave.flightNo || '').replace(/^[^0-9]+/, '');
      const airlineCodeRaw = String(leave.airlineCode || '').trim().toUpperCase();
      const airline = resolveAirline(airlineCodeRaw);
      const flightNumber = `${airline.iata}-${fltNumRaw}`;

      const depRaw = leave.departureTime || '08:00';
      const arrRaw = leave.arrivalTime || '09:30';
      const departureIso = LiveProviderIntegration.parseIsoDateWithTehranTz(depRaw, departureDate, '08:00');
      let arrivalIso = LiveProviderIntegration.parseIsoDateWithTehranTz(arrRaw, departureDate, '09:30');

      // Check if overnight arrival (arrival time is earlier than departure time)
      if (arrRaw.length <= 8 && depRaw.length <= 8 && arrRaw < depRaw) {
        const nextDay = new Date(new Date(departureDate).getTime() + 86400000).toISOString().split('T')[0];
        arrivalIso = LiveProviderIntegration.parseIsoDateWithTehranTz(arrRaw, nextDay, '09:30');
      }

      const explicitDuration = Number(leave.duration) || undefined;
      const { durationStr, durationMinutes } = LiveProviderIntegration.calculateFlightDuration(departureIso, arrivalIso, explicitDuration);

      const { flightHash } = generateFlightGroupingKey({
        airlineCode: airline.iata,
        flightNumber,
        origin,
        destination,
        departureAt: departureIso,
        cabin,
      });

      const totalPrice = Number(f.minPrice || f.price || 0);
      if (totalPrice <= 0) continue;

      const isCharter = Boolean(leave.charter || f.isCharter);
      const seatsRemaining = Number(f.capacity || leave.capacity || 4);
      const baggage = leave.baggageList?.[0] || '۲۰ کیلوگرم';
      const basePrice = Math.round(totalPrice * 0.91);
      const taxAmount = totalPrice - basePrice;

      // Deep link to seller or safarmarket
      const bestSeller = f.providers?.[0];
      const deepLink = bestSeller?.url || `https://safarmarket.com/flights/c${origin}-c${destination}/${departureDate}/0/allclasses/1adults/0children/0infants`;

      const offer: ProviderOffer = {
        provider: 'safarmarket',
        providerName: 'SafarMarket (سفرمارکت)',
        providerOfferRef: `sm-${flightHash}-${fltNumRaw}`,
        totalPrice,
        basePrice,
        taxAmount,
        currency: 'IRR',
        baggage,
        seatsRemaining,
        cancellationPolicy: isCharter ? 'قوانین چارتر سفرمارکت' : 'استرداد بر اساس قوانین سیستمی',
        isCharter,
        cabin,
        deepLink,
      };

      offers.push(offer);
      items.push({
        offer,
        rawFlightNumber: fltNumRaw,
        airlineCode: airline.iata,
        departureIso,
        arrivalIso,
        durationStr,
        durationMinutes,
      });

      const matchKey = `${airline.iata}_${fltNumRaw}`;
      groupingKeyMap.set(matchKey, offer);
      groupingKeyMap.set(flightHash, offer);
    }

    return { offers, items, groupingKeyMap, rawCount: offers.length };
  }

  /**
   * Unifies and groups flight offers from Alibaba, FlyToday, and SafarMarket
   * into canonical flight cards with multi-provider price comparison.
   */
  private static unifyLiveOffers(params: {
    origin: string;
    destination: string;
    departureDate: string;
    cabin: string;
    alibabaOffers: ProviderParseResult;
    flytodayOffers: ProviderParseResult;
    safarmarketOffers: ProviderParseResult;
  }): GroupedFlightCard[] {
    const { origin, destination, departureDate, cabin, alibabaOffers, flytodayOffers, safarmarketOffers } = params;

    const allAirports = getAirports();
    const originApt = allAirports.find((a) => (a.iata_code || '').toUpperCase() === origin);
    const destApt = allAirports.find((a) => (a.iata_code || '').toUpperCase() === destination);
    const originName = originApt ? `${originApt.city_fa || originApt.city_en} (${origin})` : origin;
    const destinationName = destApt ? `${destApt.city_fa || destApt.city_en} (${destination})` : destination;

    const cardsMap = new Map<string, GroupedFlightCard>();

    // Helper to add/merge offer into a card
    const processOffer = (
      offer: ProviderOffer,
      rawFlightNumber: string,
      airlineCode: string,
      depIso: string,
      arrIso: string,
      durationStr: string,
      durationMin: number
    ) => {
      const airline = resolveAirline(airlineCode);
      const fltDigits = rawFlightNumber.replace(/^[^0-9]+/, '');
      const fltNum = `${airline.iata}-${fltDigits}`;

      const { groupingKey, flightHash } = generateFlightGroupingKey({
        airlineCode: airline.iata,
        flightNumber: fltNum,
        origin,
        destination,
        departureAt: depIso,
        cabin,
      });

      if (!cardsMap.has(flightHash)) {
        cardsMap.set(flightHash, {
          id: flightHash,
          groupingKey,
          airline,
          flightNumber: fltNum,
          origin,
          originName,
          destination,
          destinationName,
          departureAt: depIso,
          arrivalAt: arrIso,
          duration: durationStr,
          durationMinutes: durationMin,
          stops: 0,
          cabin,
          isDomestic: true,
          providers: [offer],
          providerCount: 1,
          bestPrice: offer,
          highestPrice: offer,
          savings: 0,
        });
      } else {
        const card = cardsMap.get(flightHash)!;
        const existingIdx = card.providers.findIndex((p) => p.provider === offer.provider);
        if (existingIdx >= 0) {
          if (offer.totalPrice < card.providers[existingIdx].totalPrice) {
            card.providers[existingIdx] = offer;
          }
        } else {
          card.providers.push(offer);
        }
        card.providers.sort((a, b) => a.totalPrice - b.totalPrice);
        card.providerCount = card.providers.length;
        card.bestPrice = card.providers[0];
        card.highestPrice = card.providers[card.providers.length - 1];
        card.savings = Math.max(0, card.highestPrice.totalPrice - card.bestPrice.totalPrice);
      }
    };

    // 1. Ingest Alibaba offers with real parsed flight times
    for (const item of alibabaOffers.items) {
      processOffer(
        item.offer,
        item.rawFlightNumber,
        item.airlineCode,
        item.departureIso,
        item.arrivalIso,
        item.durationStr,
        item.durationMinutes
      );
    }

    // 2. Ingest FlyToday offers with real parsed flight times
    for (const item of flytodayOffers.items) {
      processOffer(
        item.offer,
        item.rawFlightNumber,
        item.airlineCode,
        item.departureIso,
        item.arrivalIso,
        item.durationStr,
        item.durationMinutes
      );
    }

    // 3. Ingest SafarMarket offers with real parsed flight times
    for (const item of safarmarketOffers.items) {
      processOffer(
        item.offer,
        item.rawFlightNumber,
        item.airlineCode,
        item.departureIso,
        item.arrivalIso,
        item.durationStr,
        item.durationMinutes
      );
    }

    // Cross-merge offers by flight numeric match if hash didn't collide
    const cards = Array.from(cardsMap.values());
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const c1 = cards[i];
        const c2 = cards[j];
        if (c1.flightNumber === c2.flightNumber && c1.origin === c2.origin && c1.destination === c2.destination) {
          const t1 = new Date(c1.departureAt).getTime();
          const t2 = new Date(c2.departureAt).getTime();
          const diffHours = Math.abs(t1 - t2) / (3600 * 1000);
          if (diffHours < 3) {
            // Merge c2 into c1
            for (const p of c2.providers) {
              if (!c1.providers.some((ep) => ep.provider === p.provider)) {
                c1.providers.push(p);
              }
            }
            c1.providers.sort((a, b) => a.totalPrice - b.totalPrice);
            c1.providerCount = c1.providers.length;
            c1.bestPrice = c1.providers[0];
            c1.highestPrice = c1.providers[c1.providers.length - 1];
            c1.savings = Math.max(0, c1.highestPrice.totalPrice - c1.bestPrice.totalPrice);
            cards.splice(j, 1);
            j--;
          }
        }
      }
    }

    return cards;
  }

  /**
   * Helper to ensure active session saved in SQLite
   */
  static async autoRefreshSession(provider: CrawlerProviderName): Promise<ProviderSessionData> {
    const activeProxy = IranProxyService.getActiveProxy();
    const proxyUrl = activeProxy?.url || 'http://127.0.0.1:2080';
    const timestamp = Date.now();

    const newSession: ProviderSessionData = {
      site_name: provider,
      session_id: `live_sess_${provider}_${timestamp}`,
      status: 'active',
      cookies: `session_${provider}=${timestamp}; Path=/`,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      proxy_binding: proxyUrl,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      metadata: {
        proxy_url: proxyUrl,
        provider,
      },
    };

    await ProviderSessionService.saveSession(newSession);
    return newSession;
  }

  static async autoRefreshAllProviders(): Promise<ProviderSessionData[]> {
    const providers: CrawlerProviderName[] = ['alibaba', 'flytoday', 'safarmarket'];
    return Promise.all(providers.map((p) => this.autoRefreshSession(p)));
  }
}
