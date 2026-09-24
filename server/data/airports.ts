import fs from 'node:fs';
import path from 'node:path';

export interface RawAirport {
  id: number;
  name_fa: string;
  name_en: string;
  country_fa: string;
  country_en: string;
  city_fa: string;
  city_en: string;
  iata_code: string;
  country_code: string;
  lat?: number;
  lon?: number;
}

export interface RawAirline {
  id: number;
  iata: string;
  icao: string;
  name_en: string;
  name_fa: string;
  country_en: string;
  country_fa: string;
  callsign: string;
  active: boolean;
}

let airportsCache: RawAirport[] | null = null;
let airlinesCache: RawAirline[] | null = null;

// Exact airport geographic coordinates for accurate geodesic flight distances & flight durations
export const KNOWN_AIRPORT_COORDS: Record<string, { lat: number; lon: number }> = {
  // Iran
  IKA: { lat: 35.4161, lon: 51.1522 },
  THR: { lat: 35.6892, lon: 51.3134 },
  MHD: { lat: 36.2352, lon: 59.6410 },
  SYZ: { lat: 29.5392, lon: 52.5898 },
  IFN: { lat: 32.7508, lon: 51.8613 },
  TBZ: { lat: 38.1331, lon: 46.2349 },
  KIH: { lat: 26.5262, lon: 53.9802 },
  GSM: { lat: 26.7547, lon: 55.9021 },
  BND: { lat: 27.2183, lon: 56.3778 },
  AWZ: { lat: 31.3374, lon: 48.7621 },
  KER: { lat: 30.2743, lon: 56.9644 },
  RAS: { lat: 37.3253, lon: 49.6447 },
  AZD: { lat: 31.9049, lon: 54.2765 },
  ZBR: { lat: 25.4433, lon: 60.3820 },
  KSH: { lat: 34.3460, lon: 47.1580 },
  SRY: { lat: 36.6644, lon: 53.1931 },
  OMH: { lat: 37.6689, lon: 45.0706 },
  ABD: { lat: 30.3711, lon: 48.2283 },
  BJB: { lat: 37.4939, lon: 57.3089 },
  BXR: { lat: 32.8636, lon: 59.2683 },
  LRR: { lat: 27.6744, lon: 54.3828 },
  // Canada
  YYZ: { lat: 43.6777, lon: -79.6248 },
  YTO: { lat: 43.6777, lon: -79.6248 },
  YVR: { lat: 49.1967, lon: -123.1815 },
  YUL: { lat: 45.4706, lon: -73.7408 },
  YYC: { lat: 51.1139, lon: -114.0203 },
  YEG: { lat: 53.3097, lon: -113.5797 },
  YOW: { lat: 45.3225, lon: -75.6692 },
  YHZ: { lat: 44.8808, lon: -63.5086 },
  YWG: { lat: 49.9100, lon: -97.2399 },
  // Turkey
  IST: { lat: 41.2753, lon: 28.7519 },
  SAW: { lat: 40.8986, lon: 29.3092 },
  ESB: { lat: 40.1281, lon: 32.9951 },
  AYT: { lat: 36.8987, lon: 30.8005 },
  ADB: { lat: 38.2924, lon: 27.1570 },
  DLM: { lat: 36.7131, lon: 28.7925 },
  BJV: { lat: 37.2506, lon: 27.6643 },
  // UAE & Qatar & Gulf
  DXB: { lat: 25.2532, lon: 55.3657 },
  DWC: { lat: 24.8960, lon: 55.1614 },
  SHJ: { lat: 25.3286, lon: 55.5172 },
  AUH: { lat: 24.4330, lon: 54.6511 },
  DOH: { lat: 25.2731, lon: 51.6081 },
  MCT: { lat: 23.5933, lon: 58.2844 },
  KWI: { lat: 29.2269, lon: 47.9789 },
  BAH: { lat: 26.2708, lon: 50.6336 },
  RUH: { lat: 24.9576, lon: 46.6988 },
  JED: { lat: 21.6796, lon: 39.1565 },
  MED: { lat: 24.5534, lon: 39.7051 },
  // Iraq & Levant
  BGW: { lat: 33.2625, lon: 44.2344 },
  NJF: { lat: 31.9898, lon: 44.4044 },
  EBL: { lat: 36.2372, lon: 43.9631 },
  BSR: { lat: 30.5491, lon: 47.6621 },
  BEY: { lat: 33.8209, lon: 35.4884 },
  AMM: { lat: 31.7226, lon: 35.9932 },
  DAM: { lat: 33.4113, lon: 36.5155 },
  // Caucasus & Russia
  EVN: { lat: 40.1473, lon: 44.3959 },
  TBS: { lat: 41.6692, lon: 44.9547 },
  GYD: { lat: 40.4675, lon: 50.0467 },
  SVO: { lat: 55.9726, lon: 37.4146 },
  VKO: { lat: 55.5915, lon: 37.2615 },
  DME: { lat: 55.4088, lon: 37.9063 },
  LED: { lat: 59.8003, lon: 30.2625 },
  // Europe
  FRA: { lat: 50.0379, lon: 8.5622 },
  LHR: { lat: 51.4700, lon: -0.4543 },
  LGW: { lat: 51.1537, lon: -0.1821 },
  CDG: { lat: 49.0097, lon: 2.5479 },
  AMS: { lat: 52.3105, lon: 4.7683 },
  VIE: { lat: 48.1103, lon: 16.5697 },
  MUC: { lat: 48.3537, lon: 11.7860 },
  MXP: { lat: 45.6301, lon: 8.7255 },
  FCO: { lat: 41.8003, lon: 12.2389 },
  MAD: { lat: 40.4839, lon: -3.5680 },
  BCN: { lat: 41.2974, lon: 2.0785 },
  ZRH: { lat: 47.4582, lon: 8.5555 },
  GVA: { lat: 46.2370, lon: 6.1092 },
  BRU: { lat: 50.9010, lon: 4.4856 },
  CPH: { lat: 55.6180, lon: 12.6560 },
  ARN: { lat: 59.6498, lon: 17.9238 },
  OSL: { lat: 60.1976, lon: 11.1004 },
  ATH: { lat: 37.9364, lon: 23.9445 },
  WAW: { lat: 52.1672, lon: 20.9679 },
  PRG: { lat: 50.1008, lon: 14.2600 },
  BUD: { lat: 47.4369, lon: 19.2556 },
  // United States
  JFK: { lat: 40.6413, lon: -73.7781 },
  EWR: { lat: 40.6895, lon: -74.1745 },
  LGA: { lat: 40.7769, lon: -73.8740 },
  NYC: { lat: 40.6413, lon: -73.7781 },
  LAX: { lat: 33.9416, lon: -118.4085 },
  SFO: { lat: 37.6213, lon: -122.3790 },
  ORD: { lat: 41.9742, lon: -87.9073 },
  CHI: { lat: 41.9742, lon: -87.9073 },
  IAD: { lat: 38.9531, lon: -77.4565 },
  WAS: { lat: 38.9531, lon: -77.4565 },
  BOS: { lat: 42.3656, lon: -71.0096 },
  MIA: { lat: 25.7959, lon: -80.2870 },
  DFW: { lat: 32.8998, lon: -97.0403 },
  IAH: { lat: 29.9902, lon: -95.3368 },
  SEA: { lat: 47.4502, lon: -122.3088 },
  ATL: { lat: 33.6407, lon: -84.4277 },
  // Asia & Pacific
  BKK: { lat: 13.6900, lon: 100.7501 },
  DMK: { lat: 13.9126, lon: 100.6067 },
  KUL: { lat: 2.7456, lon: 101.7072 },
  SIN: { lat: 1.3644, lon: 103.9915 },
  DEL: { lat: 28.5562, lon: 77.1000 },
  BOM: { lat: 19.0896, lon: 72.8656 },
  PEK: { lat: 40.0799, lon: 116.6031 },
  PKX: { lat: 39.5098, lon: 116.4105 },
  PVG: { lat: 31.1443, lon: 121.8083 },
  SHA: { lat: 31.1979, lon: 121.3363 },
  CAN: { lat: 23.3924, lon: 113.2988 },
  HKG: { lat: 22.3080, lon: 113.9185 },
  ICN: { lat: 37.4602, lon: 126.4407 },
  NRT: { lat: 35.7720, lon: 140.3929 },
  HND: { lat: 35.5494, lon: 139.7798 },
  TYO: { lat: 35.7720, lon: 140.3929 },
  SYD: { lat: -33.9399, lon: 151.1753 },
  MEL: { lat: -37.6690, lon: 144.8410 },
};

export const KNOWN_COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  IR: { lat: 32.4279, lon: 53.6880 },
  CA: { lat: 56.1304, lon: -106.3468 },
  US: { lat: 37.0902, lon: -95.7129 },
  TR: { lat: 38.9637, lon: 35.2433 },
  AE: { lat: 23.4241, lon: 53.8478 },
  QA: { lat: 25.3548, lon: 51.1839 },
  OM: { lat: 21.4735, lon: 55.9754 },
  IQ: { lat: 33.2232, lon: 43.6793 },
  DE: { lat: 51.1657, lon: 10.4515 },
  GB: { lat: 55.3781, lon: -3.4360 },
  FR: { lat: 46.2276, lon: 2.2137 },
  IT: { lat: 41.8719, lon: 12.5674 },
  ES: { lat: 40.4637, lon: -3.7492 },
  AU: { lat: -25.2744, lon: 133.7751 },
  CN: { lat: 35.8617, lon: 104.1954 },
  TH: { lat: 15.8700, lon: 100.9925 },
  MY: { lat: 4.2105, lon: 101.9758 },
  RU: { lat: 61.5240, lon: 105.3188 },
};

export function getAirports(): RawAirport[] {
  if (airportsCache) return airportsCache;
  const filePath = path.resolve(process.cwd(), 'misc/airports.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const raw: RawAirport[] = JSON.parse(data);
      // Enrich with coordinates
      airportsCache = raw.map((apt) => {
        const code = (apt.iata_code || '').toUpperCase();
        const coord = KNOWN_AIRPORT_COORDS[code] || KNOWN_COUNTRY_COORDS[apt.country_code];
        return {
          ...apt,
          lat: apt.lat ?? coord?.lat,
          lon: apt.lon ?? coord?.lon,
        };
      });
      return airportsCache!;
    }
  } catch (err) {
    console.warn('Could not read misc/airports.json', err);
  }
  return [];
}

export function getAirlines(): RawAirline[] {
  if (airlinesCache) return airlinesCache;
  const filePath = path.resolve(process.cwd(), 'misc/airlines_complete.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      airlinesCache = JSON.parse(data);
      return airlinesCache!;
    }
  } catch (err) {
    console.warn('Could not read misc/airlines_complete.json', err);
  }
  return [];
}
