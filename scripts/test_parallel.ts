import https from 'node:https';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyUrl = 'http://127.0.0.1:2080';
const agent = new HttpsProxyAgent(proxyUrl);

async function postJson(url: string, headers: Record<string, string>, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...headers
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON (HTTP ${res.statusCode}): ${data.slice(0, 100)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

async function testAll() {
  const origin = 'THR';
  const destination = 'MHD';
  const departureDate = '2026-09-26';

  console.log('Querying real FlyToday...');
  const ftT0 = Date.now();
  const ftPromise = postJson(
    'https://www.flytoday.ir/api/gateway/V1/flight/search',
    { Origin: 'https://www.flytoday.ir', Referer: 'https://www.flytoday.ir/' },
    {
      pricingSourceType: 0,
      adultCount: 1,
      childCount: 0,
      infantCount: 0,
      travelPreference: { cabinType: 'Y', maxStopsQuantity: 'All', airTripType: 'OneWay' },
      originDestinationInformations: [{ departureDateTime: `${departureDate}T00:00:00`, destinationLocationCode: destination, destinationType: 'City', originLocationCode: origin, originType: 'City' }],
      isJalali: false
    }
  ).then(res => ({
    count: res.pricedItineraries?.length || 0,
    time: Date.now() - ftT0
  })).catch(err => ({ error: err.message, time: Date.now() - ftT0 }));

  console.log('Querying real SafarMarket...');
  const smT0 = Date.now();
  const smPromise = postJson(
    'https://safarmarket.com/api/flight/v3/search',
    { Origin: 'https://safarmarket.com', Referer: 'https://safarmarket.com/' },
    {
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
  ).then(res => ({
    count: res.result?.flights?.length || 0,
    time: Date.now() - smT0
  })).catch(err => ({ error: err.message, time: Date.now() - smT0 }));

  const [ft, sm] = await Promise.all([ftPromise, smPromise]);
  console.log('FlyToday result:', ft);
  console.log('SafarMarket result:', sm);
}

testAll();
