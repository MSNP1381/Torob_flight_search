import { ProviderType } from '../components/ProviderLogo';
import { Dayjs } from 'dayjs';

export interface AirportChild {
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

export interface AirportCity {
  iata: string;
  type: string;
  isDomestic: boolean;
  name: string;
  countryCode: string;
  countryName: string;
  children: AirportChild[];
}

export interface ProviderOffer {
  provider: ProviderType;
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

export type FlightSortOption = 'Cheapest' | 'Fastest' | 'Earliest' | 'Algorithmic';

export interface ProviderProgressStatus {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  offersCount: number;
  durationMs?: number;
  message?: string;
  isFinished: boolean;
  updatedAt?: string;
}

export interface AirportOption {
  code: string;
  name: string;
  city: string;
}

export interface SearchFormState {
  origin: AirportOption;
  destination: AirportOption;
  depDate: Dayjs;
  cabin: string;
  selectedProviders: ProviderType[];
}

export interface DurationBinFilter {
  key: string;
  minMinutes: number;
  maxMinutes: number;
}

export interface SqliteSearchItem {
  id: string | number;
  origin: string;
  destination: string;
  departureDate: string;
  offersCount?: number;
  minPrice?: number;
  createdAt?: string;
}

export interface DbStatusData {
  airports_raw_count?: number;
  airlines_raw_count?: number;
  status?: string;
  [key: string]: any;
}

export interface SandboxFormData {
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  cabin: string;
}

export interface SandboxResultData {
  groupingKey: string;
  flightHash: string;
}
