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

export function getAirports(): RawAirport[] {
  if (airportsCache) return airportsCache;
  const filePath = path.resolve(process.cwd(), 'misc/airports.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      airportsCache = JSON.parse(data);
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
