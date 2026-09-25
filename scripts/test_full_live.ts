import https from 'node:https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { generateFlightGroupingKey } from '../server/services/flightSearch.js';
import { getAirports, getAirlines } from '../server/data/airports.js';

const proxyUrl = 'http://127.0.0.1:2080';
const agent = new HttpsProxyAgent(proxyUrl);

function requestJson(url: string, options: { method?: string; headers?: Record<string, string>; body?: any; timeoutMs?: number }): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || 'GET',
      agent,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(options.headers || {})
      },
      timeout: options.timeoutMs || 12000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 100)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTest() {
  const origin = 'THR';
  const destination = 'MHD';
  const departureDate = '2026-09-26';

  console.log(`Starting Concurrent Real Search for ${origin} -> ${destination} on ${departureDate}...`);
  const t0 = Date.now();

  const [aliRes, ftRes, smRes] = await Promise.allSettled([
    // 1. Alibaba
    (async () => {
      const start = Date.now();
      const init = await requestJson('https://ws.alibaba.ir/api/v1/flights/domestic/available', {
        method: 'POST',
        headers: { Origin: 'https://www.alibaba.ir', Referer: 'https://www.alibaba.ir/' },
        body: { origin, destination, departureDate, adult: 1 }
      });
      const reqId = init?.result?.requestId;
      if (!reqId) throw new Error('No Alibaba requestId');
      const poll = await requestJson(`https://ws.alibaba.ir/api/v1/flights/domestic/available/${reqId}`, {
        method: 'GET',
        headers: { Origin: 'https://www.alibaba.ir', Referer: 'https://www.alibaba.ir/' }
      });
      const departing = poll?.result?.departing || [];
      return {
        provider: 'alibaba',
        count: departing.length,
        duration: Date.now() - start,
        flights: departing
      };
    })(),

    // 2. FlyToday
    (async () => {
      const start = Date.now();
      const res = await requestJson('https://www.flytoday.ir/api/gateway/V1/flight/search', {
        method: 'POST',
        headers: { Origin: 'https://www.flytoday.ir', Referer: 'https://www.flytoday.ir/' },
        body: {
          pricingSourceType: 0,
          adultCount: 1,
          childCount: 0,
          infantCount: 0,
          travelPreference: { cabinType: 'Y', maxStopsQuantity: 'All', airTripType: 'OneWay' },
          originDestinationInformations: [{ departureDateTime: `${departureDate}T00:00:00`, destinationLocationCode: destination, destinationType: 'City', originLocationCode: origin, originType: 'City' }],
          isJalali: false
        }
      });
      const itins = res?.pricedItineraries || [];
      return {
        provider: 'flytoday',
        count: itins.length,
        duration: Date.now() - start,
        itineraries: itins
      };
    })(),

    // 3. SafarMarket
    (async () => {
      const start = Date.now();
      const res = await requestJson('https://safarmarket.com/api/flight/v3/search', {
        method: 'POST',
        headers: { Origin: 'https://safarmarket.com', Referer: 'https://safarmarket.com/' },
        body: {
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
            economy: true,
            business: true,
            maxStopsQuantity: 'All',
            isJalali: false
          }
        }
      });
      const flights = res?.result?.flights || [];
      return {
        provider: 'safarmarket',
        count: flights.length,
        duration: Date.now() - start,
        flights
      };
    })()
  ]);

  console.log('\n--- PROGRESS & FINISHED STATUS RESULTS ---');
  const results = [
    { name: 'Alibaba (علی‌بابا)', res: aliRes },
    { name: 'FlyToday (فلای‌تودی)', res: ftRes },
    { name: 'SafarMarket (سفرمارکت)', res: smRes }
  ];

  results.forEach(r => {
    if (r.res.status === 'fulfilled') {
      const val = r.res.value;
      console.log(`✅ [FINISHED] ${r.name}: ${val.count} real flights found in ${val.duration}ms`);
    } else {
      console.log(`❌ [FAILED] ${r.name}: ${(r.res as PromiseRejectedResult).reason.message}`);
    }
  });

  console.log(`\nTotal concurrent execution time: ${Date.now() - t0}ms`);
}

runTest();
