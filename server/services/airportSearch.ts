import { getAirports, RawAirport } from '../data/airports.js';

export interface AirportSearchChildResponse {
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

export interface AirportSearchCityResponse {
  iata: string;
  type: string;
  isDomestic: boolean;
  name: string;
  countryCode: string;
  countryName: string;
  latitude: number | null;
  longitude: number | null;
  children: AirportSearchChildResponse[];
}

function normalizePersianText(str: string): string {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
    .replace(/[\u064B-\u065F]/g, '') // remove Arabic diacritics
    .replace(/[آأإ]/g, 'ا')
    .trim()
    .toLowerCase();
}

export function searchAirports(qRaw: string, limit = 20): AirportSearchCityResponse[] {
  const qClean = qRaw.trim().toLowerCase();
  const qPersian = normalizePersianText(qRaw);
  if (!qClean) return [];

  const allAirports = getAirports();
  const matched = allAirports.filter((apt) => {
    const iata = (apt.iata_code || '').toLowerCase();
    const nameFa = normalizePersianText(apt.name_fa || '');
    const nameEn = (apt.name_en || '').toLowerCase();
    const cityFa = normalizePersianText(apt.city_fa || '');
    const cityEn = (apt.city_en || '').toLowerCase();

    // Exact IATA matches first
    if (iata === qClean) return true;
    if (iata.startsWith(qClean)) return true;

    // Search English & Persian
    return (
      nameEn.includes(qClean) ||
      cityEn.includes(qClean) ||
      nameFa.includes(qPersian) ||
      cityFa.includes(qPersian)
    );
  });

  // Group by city
  const cityMap = new Map<string, {
    cityIata: string;
    cityName: string;
    countryCode: string;
    countryName: string;
    isDomestic: boolean;
    lat: number | null;
    lon: number | null;
    children: AirportSearchChildResponse[];
  }>();

  for (const apt of matched) {
    const isDomestic = apt.country_code === 'IR';
    const cityKey = (apt.city_en || apt.city_fa || apt.iata_code).toLowerCase();
    
    const isTehran = cityKey === 'tehran' || cityKey === 'تهران';
    if (!cityMap.has(cityKey)) {
      cityMap.set(cityKey, {
        cityIata: isTehran ? 'THR' : apt.iata_code,
        cityName: apt.city_fa || apt.name_fa || apt.city_en || apt.iata_code,
        countryCode: apt.country_code,
        countryName: apt.country_fa || apt.country_en || '',
        isDomestic,
        lat: apt.lat ?? null,
        lon: apt.lon ?? null,
        children: [],
      });
    } else if (isTehran && apt.iata_code === 'THR') {
      const g = cityMap.get(cityKey)!;
      g.cityIata = 'THR';
    }

    const group = cityMap.get(cityKey)!;
    group.children.push({
      iata: apt.iata_code,
      type: 'Airport',
      isDomestic,
      name: apt.name_fa || apt.name_en,
      cityName: apt.city_fa || apt.city_en || null,
      countryCode: apt.country_code,
      countryName: apt.country_fa || apt.country_en,
      latitude: apt.lat ?? null,
      longitude: apt.lon ?? null,
    });
  }

  const results: AirportSearchCityResponse[] = [];
  for (const group of cityMap.values()) {
    results.push({
      iata: group.cityIata,
      type: 'City',
      isDomestic: group.isDomestic,
      name: group.cityName,
      countryCode: group.countryCode,
      countryName: group.countryName,
      latitude: group.lat,
      longitude: group.lon,
      children: group.children,
    });
    if (results.length >= limit) break;
  }

  return results;
}
