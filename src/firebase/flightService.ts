import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export interface FirebaseSearchRecord {
  id?: string;
  origin: string;
  destination: string;
  departureDate: string;
  cabin: string;
  providers: string[];
  offersCount: number;
  groupedFlightsCount: number;
  createdAt: any;
}

export interface FirebaseBookingRecord {
  id?: string;
  flightId: string;
  groupingKey: string;
  flightNumber: string;
  airlineName: string;
  origin: string;
  destination: string;
  departureAt: string;
  provider: string;
  totalPrice: number;
  status: string;
  createdAt: any;
}

export async function logSearchToFirebase(data: Omit<FirebaseSearchRecord, 'createdAt'>) {
  try {
    const colRef = collection(db, 'search_sessions');
    await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firebase search log warning:', err);
  }
}

export async function saveBookingToFirebase(data: Omit<FirebaseBookingRecord, 'createdAt'>) {
  try {
    const colRef = collection(db, 'bookings');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firebase booking log warning:', err);
    return null;
  }
}

export async function getRecentSearchesFromFirebase(): Promise<FirebaseSearchRecord[]> {
  try {
    const colRef = collection(db, 'search_sessions');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(5));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirebaseSearchRecord));
  } catch (err) {
    console.warn('Failed to get recent searches from Firebase:', err);
    return [];
  }
}

export interface FirebaseProviderSessionRecord {
  id?: string;
  site_name: string;
  status: string;
  session_id?: string;
  proxy_binding?: string;
  cookies?: string;
  headers?: any;
  expires_at?: string;
  created_at: any;
  last_used_at?: any;
}

export async function getProviderSessionsFromFirebase(): Promise<FirebaseProviderSessionRecord[]> {
  try {
    const colRef = collection(db, 'provider_sessions');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirebaseProviderSessionRecord));
  } catch (err) {
    console.warn('Failed to get provider sessions from Firebase:', err);
    return [];
  }
}
