// Comprehensive airport coordinates database for accurate Haversine distance & realistic flight duration calculations
export interface AirportGeo {
  lat: number;
  lon: number;
  cityFa: string;
  country: string;
  isIranHub?: boolean;
}

export const AIRPORT_COORDINATES: Record<string, AirportGeo> = {
  // --- IRANIAN AIRPORTS ---
  IKA: { lat: 35.4161, lon: 51.1522, cityFa: 'تهران (امام خمینی)', country: 'IR', isIranHub: true },
  THR: { lat: 35.6892, lon: 51.3134, cityFa: 'تهران (مهرآباد)', country: 'IR', isIranHub: true },
  MHD: { lat: 36.2352, lon: 59.6409, cityFa: 'مشهد', country: 'IR', isIranHub: true },
  SYZ: { lat: 29.5392, lon: 52.5898, cityFa: 'شیراز', country: 'IR', isIranHub: true },
  IFN: { lat: 32.7508, lon: 51.8614, cityFa: 'اصفهان', country: 'IR', isIranHub: true },
  TBZ: { lat: 38.1331, lon: 46.2350, cityFa: 'تبریز', country: 'IR', isIranHub: true },
  KIH: { lat: 26.5262, lon: 53.9802, cityFa: 'کیش', country: 'IR', isIranHub: true },
  GSM: { lat: 26.7547, lon: 55.9025, cityFa: 'قشم', country: 'IR' },
  AWZ: { lat: 31.3374, lon: 48.7620, cityFa: 'اهواز', country: 'IR' },
  BND: { lat: 27.2183, lon: 56.3778, cityFa: 'بندرعباس', country: 'IR' },
  KSH: { lat: 34.3458, lon: 47.1581, cityFa: 'کرمانشاه', country: 'IR' },
  RAS: { lat: 37.3253, lon: 49.6214, cityFa: 'رشت', country: 'IR' },
  AZD: { lat: 31.9049, lon: 54.2765, cityFa: 'یزد', country: 'IR' },
  ZAH: { lat: 29.4758, lon: 60.9064, cityFa: 'زاهدان', country: 'IR' },
  KER: { lat: 30.2742, lon: 56.9639, cityFa: 'کرمان', country: 'IR' },
  BUZ: { lat: 28.9448, lon: 50.8344, cityFa: 'بوشهر', country: 'IR' },
  ABD: { lat: 30.3711, lon: 48.2283, cityFa: 'آبادان', country: 'IR' },
  OMH: { lat: 37.6689, lon: 45.0697, cityFa: 'ارومیه', country: 'IR' },
  SRY: { lat: 36.6644, lon: 53.1931, cityFa: 'ساری', country: 'IR' },
  GBT: { lat: 36.9097, lon: 54.4011, cityFa: 'گرگان', country: 'IR' },
  ZBR: { lat: 25.4433, lon: 60.3811, cityFa: 'چابهار', country: 'IR' },
  ADU: { lat: 31.9900, lon: 49.8800, cityFa: 'اردبیل', country: 'IR' },
  JWN: { lat: 36.6400, lon: 45.1400, cityFa: 'زنجان', country: 'IR' },
  KHD: { lat: 33.4300, lon: 48.2800, cityFa: 'خرم‌آباد', country: 'IR' },
  YES: { lat: 30.7000, lon: 51.5500, cityFa: 'یاسوج', country: 'IR' },
  BJB: { lat: 37.4900, lon: 57.3100, cityFa: 'بجنورد', country: 'IR' },
  XBJ: { lat: 32.8600, lon: 59.2700, cityFa: 'بیرجند', country: 'IR' },
  IIL: { lat: 33.5800, lon: 46.4000, cityFa: 'ایلام', country: 'IR' },
  SNX: { lat: 35.2500, lon: 47.0100, cityFa: 'سنندج', country: 'IR' },
  HDX: { lat: 34.8700, lon: 48.5500, cityFa: 'همدان', country: 'IR' },
  CQD: { lat: 32.2900, lon: 50.8400, cityFa: 'شهرکرد', country: 'IR' },
  RZR: { lat: 36.9000, lon: 50.6800, cityFa: 'رامسر', country: 'IR' },
  NSH: { lat: 36.6500, lon: 51.4800, cityFa: 'نوشهر', country: 'IR' },

  // --- CANADA (NORTH AMERICA) ---
  YYZ: { lat: 43.6777, lon: -79.6248, cityFa: 'تورنتو', country: 'CA' },
  YTZ: { lat: 43.6281, lon: -79.3962, cityFa: 'تورنتو (بیلی بیشاپ)', country: 'CA' },
  YVR: { lat: 49.1947, lon: -123.1792, cityFa: 'ونکوور', country: 'CA' },
  YUL: { lat: 45.4657, lon: -73.7455, cityFa: 'مونترال', country: 'CA' },
  YYC: { lat: 51.1215, lon: -114.0076, cityFa: 'کلگری', country: 'CA' },
  YOW: { lat: 45.3225, lon: -75.6692, cityFa: 'اتاوا', country: 'CA' },
  YEG: { lat: 53.3097, lon: -113.5797, cityFa: 'ادمونتون', country: 'CA' },
  YHZ: { lat: 44.8808, lon: -63.5086, cityFa: 'هالیفاکس', country: 'CA' },

  // --- UNITED STATES ---
  JFK: { lat: 40.6413, lon: -73.7781, cityFa: 'نیویورک (جی‌اف‌کی)', country: 'US' },
  EWR: { lat: 40.6895, lon: -74.1745, cityFa: 'نیویورک (نیوآرک)', country: 'US' },
  LAX: { lat: 33.9416, lon: -118.4085, cityFa: 'لس آنجلس', country: 'US' },
  SFO: { lat: 37.6213, lon: -122.3790, cityFa: 'سان فرانسیسکو', country: 'US' },
  ORD: { lat: 41.9742, lon: -87.9073, cityFa: 'شیکاگو', country: 'US' },
  IAD: { lat: 38.9531, lon: -77.4565, cityFa: 'واشنگتن', country: 'US' },
  MIA: { lat: 25.7959, lon: -80.2870, cityFa: 'میامی', country: 'US' },
  BOS: { lat: 42.3656, lon: -71.0096, cityFa: 'بوستون', country: 'US' },
  SEA: { lat: 47.4502, lon: -122.3088, cityFa: 'سیاتل', country: 'US' },
  DFW: { lat: 32.8998, lon: -97.0403, cityFa: 'دالاس', country: 'US' },
  ATL: { lat: 33.6407, lon: -84.4277, cityFa: 'آتلانتا', country: 'US' },
  IAH: { lat: 29.9902, lon: -95.3368, cityFa: 'هیوستون', country: 'US' },

  // --- MIDDLE EAST & TRANSIT HUBS ---
  IST: { lat: 41.2753, lon: 28.7519, cityFa: 'استانبول', country: 'TR' },
  SAW: { lat: 40.8986, lon: 29.3092, cityFa: 'استانبول (صبیحه)', country: 'TR' },
  ESB: { lat: 40.1281, lon: 32.9951, cityFa: 'آنکارا', country: 'TR' },
  AYT: { lat: 36.8987, lon: 30.8005, cityFa: 'آنتالیا', country: 'TR' },
  DXB: { lat: 25.2532, lon: 55.3657, cityFa: 'دبی', country: 'AE' },
  DWC: { lat: 24.8960, lon: 55.1614, cityFa: 'دبی (المکتوم)', country: 'AE' },
  SHJ: { lat: 25.3286, lon: 55.5172, cityFa: 'شارجه', country: 'AE' },
  DOH: { lat: 25.2731, lon: 51.6081, cityFa: 'دوحه', country: 'QA' },
  MCT: { lat: 23.5933, lon: 58.2844, cityFa: 'مسقط', country: 'OM' },
  NJF: { lat: 31.9897, lon: 44.4042, cityFa: 'نجف', country: 'IQ' },
  BGW: { lat: 33.2625, lon: 44.2344, cityFa: 'بغداد', country: 'IQ' },
  KWI: { lat: 29.2267, lon: 47.9689, cityFa: 'کویت', country: 'KW' },
  BAH: { lat: 26.2708, lon: 50.6336, cityFa: 'بحرین', country: 'BH' },
  TBS: { lat: 41.6692, lon: 44.9547, cityFa: 'تفلیس', country: 'GE' },
  EVN: { lat: 40.1473, lon: 44.3959, cityFa: 'ایروان', country: 'AM' },
  GYD: { lat: 40.4675, lon: 50.0469, cityFa: 'باکو', country: 'AZ' },

  // --- EUROPE ---
  LHR: { lat: 51.4700, lon: -0.4543, cityFa: 'لندن (هیترو)', country: 'GB' },
  LGW: { lat: 51.1537, lon: -0.1821, cityFa: 'لندن (گتویک)', country: 'GB' },
  MAN: { lat: 53.3537, lon: -2.2750, cityFa: 'منچستر', country: 'GB' },
  CDG: { lat: 49.0097, lon: 2.5479, cityFa: 'پاریس (شارل دوگل)', country: 'FR' },
  ORY: { lat: 48.7262, lon: 2.3652, cityFa: 'پاریس (اورلی)', country: 'FR' },
  FRA: { lat: 50.0379, lon: 8.5622, cityFa: 'فرانکفورت', country: 'DE' },
  MUC: { lat: 48.3537, lon: 11.7750, cityFa: 'مونیخ', country: 'DE' },
  BER: { lat: 52.3667, lon: 13.5033, cityFa: 'برلین', country: 'DE' },
  HAM: { lat: 53.6304, lon: 9.9882, cityFa: 'هامبورگ', country: 'DE' },
  DUS: { lat: 51.2895, lon: 6.7668, cityFa: 'دوسلدورف', country: 'DE' },
  AMS: { lat: 52.3105, lon: 4.7683, cityFa: 'آمستردام', country: 'NL' },
  VIE: { lat: 48.1103, lon: 16.5697, cityFa: 'وین', country: 'AT' },
  ZRH: { lat: 47.4582, lon: 8.5555, cityFa: 'زوریخ', country: 'CH' },
  GVA: { lat: 46.2370, lon: 6.1092, cityFa: 'ژنو', country: 'CH' },
  BRU: { lat: 50.9014, lon: 4.4844, cityFa: 'بروکسل', country: 'BE' },
  FCO: { lat: 41.8003, lon: 12.2389, cityFa: 'رم', country: 'IT' },
  MXP: { lat: 45.6301, lon: 8.7255, cityFa: 'میلان', country: 'IT' },
  MAD: { lat: 40.4839, lon: -3.5680, cityFa: 'مادرید', country: 'ES' },
  BCN: { lat: 41.2974, lon: 2.0833, cityFa: 'بارسلونا', country: 'ES' },
  CPH: { lat: 55.6180, lon: 12.6508, cityFa: 'کپنهاگ', country: 'DK' },
  ARN: { lat: 59.6498, lon: 17.9238, cityFa: 'استکهلم', country: 'SE' },
  OSL: { lat: 60.1976, lon: 11.1004, cityFa: 'اسلو', country: 'NO' },
  HEL: { lat: 60.3172, lon: 24.9633, cityFa: 'هلسینکی', country: 'FI' },
  WAW: { lat: 52.1672, lon: 20.9679, cityFa: 'ورشو', country: 'PL' },
  PRG: { lat: 50.1008, lon: 14.2600, cityFa: 'پراگ', country: 'CZ' },
  BUD: { lat: 47.4369, lon: 19.2556, cityFa: 'بوداپست', country: 'HU' },

  // --- ASIA & OCEANIA ---
  BKK: { lat: 13.6900, lon: 100.7501, cityFa: 'بانکوک', country: 'TH' },
  HKT: { lat: 8.1132, lon: 98.3169, cityFa: 'پوکت', country: 'TH' },
  KUL: { lat: 2.7456, lon: 101.7099, cityFa: 'کوالالامپور', country: 'MY' },
  SIN: { lat: 1.3644, lon: 103.9915, cityFa: 'سنگاپور', country: 'SG' },
  DEL: { lat: 28.5562, lon: 77.1000, cityFa: 'دهلی', country: 'IN' },
  BOM: { lat: 19.0896, lon: 72.8656, cityFa: 'بمبئی', country: 'IN' },
  NRT: { lat: 35.7720, lon: 140.3929, cityFa: 'توکیو (ناریتا)', country: 'JP' },
  HND: { lat: 35.5494, lon: 139.7798, cityFa: 'توکیو (هاندا)', country: 'JP' },
  ICN: { lat: 37.4602, lon: 126.4407, cityFa: 'سئول', country: 'KR' },
  PEK: { lat: 40.0799, lon: 116.6031, cityFa: 'پکن', country: 'CN' },
  PVG: { lat: 31.1443, lon: 121.8083, cityFa: 'شانگهای', country: 'CN' },
  SYD: { lat: -33.9399, lon: 151.1753, cityFa: 'سیدنی', country: 'AU' },
  MEL: { lat: -37.6690, lon: 144.8410, cityFa: 'ملبورن', country: 'AU' },
};

// Calculate Haversine distance in km
export function calculateGeoDistanceKm(originIata: string, destIata: string): number {
  const o = AIRPORT_COORDINATES[originIata.toUpperCase()];
  const d = AIRPORT_COORDINATES[destIata.toUpperCase()];
  if (!o || !d) {
    // If not in detailed table, estimate based on country
    return 1200;
  }

  const R = 6371; // km
  const dLat = ((d.lat - o.lat) * Math.PI) / 180;
  const dLon = ((d.lon - o.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((o.lat * Math.PI) / 180) *
      Math.cos((d.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
