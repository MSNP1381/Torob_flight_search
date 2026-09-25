import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'data', 'buyo.sqlite');

export interface DbProviderSession {
  site_name: string;
  session_id?: string;
  flow_id?: string;
  auth_state?: string;
  status: string;
  proxy_binding?: string;
  cookies?: string;
  headers?: string | Record<string, string>;
  session_storage?: string | Record<string, any>;
  local_storage?: string | Record<string, any>;
  expires_at?: string;
  last_used_at?: string;
  created_at?: string;
  metadata?: string | Record<string, any>;
}

export interface DbSearchSession {
  id?: number;
  session_uuid?: string;
  origin_iata_code: string;
  destination_iata_code: string;
  departure_date: string;
  return_date?: string | null;
  cabin_class?: string;
  adult_count?: number;
  child_count?: number;
  infant_count?: number;
  status?: string;
  created_at?: string;
}

export interface DbFlightOffer {
  id?: number;
  search_session_id: number;
  grouping_key: string;
  flight_hash: string;
  provider_code: string;
  flight_number: string;
  airline_iata?: string;
  origin_iata: string;
  destination_iata: string;
  departure_at: string;
  arrival_at: string;
  duration?: string;
  stops?: number;
  cabin?: string;
  is_charter?: boolean | number;
  total_price: number;
  base_price: number;
  tax_amount: number;
  currency?: string;
  seats_remaining?: number;
  baggage?: string;
  raw_payload?: string;
}

class SqliteService {
  private db: DatabaseSync;

  constructor() {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.db = new DatabaseSync(DB_PATH);
    this.initTables();
  }

  private initTables(): void {
    // 1. Provider Sessions (Credentials, Cookies, Auth states)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS provider_sessions (
        site_name TEXT PRIMARY KEY,
        session_id TEXT,
        flow_id TEXT,
        auth_state TEXT DEFAULT 'anonymous',
        status TEXT DEFAULT 'active',
        proxy_binding TEXT,
        cookies TEXT,
        headers TEXT,
        session_storage TEXT,
        local_storage TEXT,
        expires_at TEXT,
        last_used_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );
    `);

    // 2. Search Sessions (Flight query history)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS search_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_uuid TEXT UNIQUE,
        user_id INTEGER,
        origin_iata_code TEXT NOT NULL,
        destination_iata_code TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        return_date TEXT,
        adult_count INTEGER DEFAULT 1,
        child_count INTEGER DEFAULT 0,
        infant_count INTEGER DEFAULT 0,
        cabin_class TEXT DEFAULT 'economy',
        status TEXT DEFAULT 'COMPLETED',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Flight Offers (Aggregated results per search session)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS flight_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        search_session_id INTEGER NOT NULL,
        grouping_key TEXT NOT NULL,
        flight_hash TEXT NOT NULL,
        provider_code TEXT NOT NULL,
        flight_number TEXT NOT NULL,
        airline_iata TEXT,
        origin_iata TEXT,
        destination_iata TEXT,
        departure_at TEXT NOT NULL,
        arrival_at TEXT NOT NULL,
        duration TEXT,
        stops INTEGER DEFAULT 0,
        cabin TEXT DEFAULT 'economy',
        is_charter INTEGER DEFAULT 0,
        total_price NUMERIC(18, 2) NOT NULL,
        base_price NUMERIC(18, 2) NOT NULL,
        tax_amount NUMERIC(18, 2) NOT NULL,
        currency TEXT DEFAULT 'IRR',
        seats_remaining INTEGER DEFAULT 9,
        baggage TEXT,
        raw_payload TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_flight_offers_session ON flight_offers(search_session_id);
      CREATE INDEX IF NOT EXISTS idx_flight_offers_hash ON flight_offers(flight_hash);
    `);
  }

  // ==========================================
  // Provider Sessions (Credentials & Cookies)
  // ==========================================

  saveProviderSession(data: DbProviderSession): void {
    const siteKey = data.site_name.toLowerCase();
    const nowIso = new Date().toISOString();
    const headersStr = typeof data.headers === 'object' ? JSON.stringify(data.headers) : data.headers || null;
    const cookiesStr = typeof data.cookies === 'object' ? JSON.stringify(data.cookies) : data.cookies || null;
    const sessStorageStr = typeof data.session_storage === 'object' ? JSON.stringify(data.session_storage) : data.session_storage || null;
    const localStorageStr = typeof data.local_storage === 'object' ? JSON.stringify(data.local_storage) : data.local_storage || null;
    const metaStr = typeof data.metadata === 'object' ? JSON.stringify(data.metadata) : data.metadata || null;

    const stmt = this.db.prepare(`
      INSERT INTO provider_sessions (
        site_name, session_id, flow_id, auth_state, status, proxy_binding,
        cookies, headers, session_storage, local_storage, expires_at, last_used_at, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(site_name) DO UPDATE SET
        session_id = excluded.session_id,
        flow_id = coalesce(excluded.flow_id, provider_sessions.flow_id),
        auth_state = coalesce(excluded.auth_state, provider_sessions.auth_state),
        status = excluded.status,
        proxy_binding = coalesce(excluded.proxy_binding, provider_sessions.proxy_binding),
        cookies = coalesce(excluded.cookies, provider_sessions.cookies),
        headers = coalesce(excluded.headers, provider_sessions.headers),
        session_storage = coalesce(excluded.session_storage, provider_sessions.session_storage),
        local_storage = coalesce(excluded.local_storage, provider_sessions.local_storage),
        expires_at = coalesce(excluded.expires_at, provider_sessions.expires_at),
        last_used_at = excluded.last_used_at,
        metadata = coalesce(excluded.metadata, provider_sessions.metadata);
    `);

    stmt.run(
      siteKey,
      data.session_id || null,
      data.flow_id || null,
      data.auth_state || 'anonymous',
      data.status || 'active',
      data.proxy_binding || null,
      cookiesStr,
      headersStr,
      sessStorageStr,
      localStorageStr,
      data.expires_at || null,
      nowIso,
      data.created_at || nowIso,
      metaStr
    );
  }

  getProviderSession(siteName: string): DbProviderSession | null {
    const siteKey = siteName.toLowerCase();
    const stmt = this.db.prepare(`
      SELECT * FROM provider_sessions WHERE site_name = ? LIMIT 1;
    `);
    const row = stmt.get(siteKey) as any;
    if (!row) return null;

    return {
      site_name: row.site_name,
      session_id: row.session_id,
      flow_id: row.flow_id,
      auth_state: row.auth_state,
      status: row.status,
      proxy_binding: row.proxy_binding,
      cookies: row.cookies,
      headers: row.headers ? this.tryParseJson(row.headers) : undefined,
      session_storage: row.session_storage ? this.tryParseJson(row.session_storage) : undefined,
      local_storage: row.local_storage ? this.tryParseJson(row.local_storage) : undefined,
      expires_at: row.expires_at,
      last_used_at: row.last_used_at,
      created_at: row.created_at,
      metadata: row.metadata ? this.tryParseJson(row.metadata) : undefined,
    };
  }

  getAllProviderSessions(): DbProviderSession[] {
    const stmt = this.db.prepare(`
      SELECT * FROM provider_sessions ORDER BY site_name ASC;
    `);
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      site_name: row.site_name,
      session_id: row.session_id,
      flow_id: row.flow_id,
      auth_state: row.auth_state,
      status: row.status,
      proxy_binding: row.proxy_binding,
      cookies: row.cookies,
      headers: row.headers ? this.tryParseJson(row.headers) : undefined,
      session_storage: row.session_storage ? this.tryParseJson(row.session_storage) : undefined,
      local_storage: row.local_storage ? this.tryParseJson(row.local_storage) : undefined,
      expires_at: row.expires_at,
      last_used_at: row.last_used_at,
      created_at: row.created_at,
      metadata: row.metadata ? this.tryParseJson(row.metadata) : undefined,
    }));
  }

  deleteProviderSession(siteName: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM provider_sessions WHERE site_name = ?;
    `);
    stmt.run(siteName.toLowerCase());
    return true;
  }

  // ==========================================
  // Search Sessions & Flight Offers (History)
  // ==========================================

  saveSearchSession(session: DbSearchSession): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO search_sessions (
        session_uuid, user_id, origin_iata_code, destination_iata_code,
        departure_date, return_date, adult_count, child_count, infant_count,
        cabin_class, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const nowIso = session.created_at || new Date().toISOString();
    const info = stmt.run(
      session.session_uuid || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      1, // default guest user
      session.origin_iata_code.toUpperCase(),
      session.destination_iata_code.toUpperCase(),
      session.departure_date,
      session.return_date || null,
      session.adult_count || 1,
      session.child_count || 0,
      session.infant_count || 0,
      session.cabin_class || 'economy',
      session.status || 'COMPLETED',
      nowIso
    );

    return Number(info.lastInsertRowid);
  }

  saveFlightOffers(searchSessionId: number, offers: DbFlightOffer[]): void {
    if (!offers || offers.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO flight_offers (
        search_session_id, grouping_key, flight_hash, provider_code,
        flight_number, airline_iata, origin_iata, destination_iata,
        departure_at, arrival_at, duration, stops, cabin, is_charter,
        total_price, base_price, tax_amount, currency, seats_remaining, baggage, raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const off of offers) {
      stmt.run(
        searchSessionId,
        off.grouping_key,
        off.flight_hash,
        off.provider_code,
        off.flight_number,
        off.airline_iata || null,
        off.origin_iata,
        off.destination_iata,
        off.departure_at,
        off.arrival_at,
        off.duration || null,
        off.stops || 0,
        off.cabin || 'economy',
        off.is_charter ? 1 : 0,
        off.total_price,
        off.base_price,
        off.tax_amount,
        off.currency || 'IRR',
        off.seats_remaining ?? 9,
        off.baggage || null,
        off.raw_payload || null
      );
    }
  }

  getRecentSearches(limitCount: number = 20): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        s.id,
        s.session_uuid,
        s.origin_iata_code as origin,
        s.destination_iata_code as destination,
        s.departure_date as departureDate,
        s.return_date as returnDate,
        s.cabin_class as cabin,
        s.status,
        s.created_at as createdAt,
        COUNT(f.id) as offersCount,
        MIN(f.total_price) as minPrice
      FROM search_sessions s
      LEFT JOIN flight_offers f ON s.id = f.search_session_id
      GROUP BY s.id
      ORDER BY s.id DESC
      LIMIT ?;
    `);

    return stmt.all(limitCount) as any[];
  }

  getSearchOffersBySessionId(sessionId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM flight_offers WHERE search_session_id = ? ORDER BY total_price ASC;
    `);
    return stmt.all(sessionId) as any[];
  }

  deleteSearchSession(sessionId: number): boolean {
    this.db.prepare(`DELETE FROM flight_offers WHERE search_session_id = ?`).run(sessionId);
    this.db.prepare(`DELETE FROM search_sessions WHERE id = ?`).run(sessionId);
    return true;
  }

  private tryParseJson(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }
}

export const sqliteService = new SqliteService();
