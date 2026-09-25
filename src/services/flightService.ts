export interface BookingRecord {
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
  createdAt?: string;
}

export async function saveBookingToSqlite(data: Omit<BookingRecord, 'createdAt'>): Promise<string | null> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.bookingId || null;
  } catch (err) {
    console.warn('SQLite booking save warning:', err);
    return null;
  }
}

export async function testSqliteConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/sqlite/status');
    if (!res.ok) return false;
    const json = await res.json();
    return json.success === true;
  } catch (err) {
    console.warn('SQLite status check failed:', err);
    return false;
  }
}
