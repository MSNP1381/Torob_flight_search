/**
 * Provider Session Store
 * Handles in-memory caching and SQLite (data/torob.sqlite) persistence of crawler cookies and credentials.
 */

import { sqliteService, DbProviderSession } from './sqliteDb.js';

export interface ProviderSessionData {
  id?: string;
  site_name: 'alibaba' | 'flytoday' | 'safarmarket' | string;
  session_id?: string;
  flow_id?: string;
  auth_state?: 'anonymous' | 'authenticated' | 'refreshed' | string;
  status: 'active' | 'expired' | 'blocked';
  proxy_binding?: string;
  cookies?: string; // Serialized cookie string, array, or encrypted string
  headers?: Record<string, string> | string;
  session_storage?: Record<string, any> | string;
  local_storage?: Record<string, any> | string;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// In-memory runtime cache for server-side fast access
const sessionCache = new Map<string, ProviderSessionData>();

// Pre-load existing sessions from SQLite into memory cache on startup
try {
  const existingSessions = sqliteService.getAllProviderSessions();
  for (const sess of existingSessions) {
    sessionCache.set(sess.site_name.toLowerCase(), sess as ProviderSessionData);
  }
} catch (err) {
  console.warn('[ProviderSession] Preloading from SQLite notice:', (err as Error).message);
}

export class ProviderSessionService {
  /**
   * Save or update a provider session/cookie set in SQLite & memory cache
   */
  static async saveSession(session: ProviderSessionData): Promise<ProviderSessionData> {
    const siteKey = session.site_name.toLowerCase();
    const nowIso = new Date().toISOString();

    const record: ProviderSessionData = {
      ...session,
      site_name: siteKey,
      status: session.status || 'active',
      created_at: session.created_at || nowIso,
      last_used_at: nowIso,
    };

    // Cache in-memory
    sessionCache.set(siteKey, record);

    // Save to SQLite
    try {
      sqliteService.saveProviderSession(record as DbProviderSession);
    } catch (err) {
      console.warn(`[ProviderSession] Warning: could not persist to SQLite (${(err as Error).message})`);
    }

    return record;
  }

  /**
   * Get active session for a specific provider
   */
  static async getActiveSession(siteName: string): Promise<ProviderSessionData | null> {
    const siteKey = siteName.toLowerCase();

    // Check in-memory cache first
    let cached = sessionCache.get(siteKey);

    // If not in cache, load from SQLite
    if (!cached) {
      try {
        const fromDb = sqliteService.getProviderSession(siteKey);
        if (fromDb) {
          cached = fromDb as ProviderSessionData;
          sessionCache.set(siteKey, cached);
        }
      } catch (err) {
        console.warn(`[ProviderSession] SQLite lookup warning: ${(err as Error).message}`);
      }
    }

    if (cached && cached.status === 'active') {
      // Check expiry if defined
      if (cached.expires_at) {
        const exp = new Date(cached.expires_at).getTime();
        if (Date.now() > exp) {
          cached.status = 'expired';
          sqliteService.saveProviderSession(cached as DbProviderSession);
          return null;
        }
      }
      return cached;
    }

    return null;
  }

  /**
   * List all stored provider sessions and their status
   */
  static getAllSessions(): Array<{
    site_name: string;
    status: string;
    has_cookies: boolean;
    expires_at?: string;
    last_used_at?: string;
    created_at: string;
    proxy_binding?: string;
  }> {
    const list: any[] = [];
    const knownProviders = ['alibaba', 'flytoday', 'safarmarket'];

    for (const p of knownProviders) {
      let s = sessionCache.get(p);
      if (!s) {
        try {
          const fromDb = sqliteService.getProviderSession(p);
          if (fromDb) {
            s = fromDb as ProviderSessionData;
            sessionCache.set(p, s);
          }
        } catch {}
      }

      if (s) {
        list.push({
          site_name: p,
          status: s.status,
          has_cookies: Boolean(s.cookies && s.cookies.length > 0),
          expires_at: s.expires_at,
          last_used_at: s.last_used_at,
          created_at: s.created_at,
          proxy_binding: s.proxy_binding || 'direct',
        });
      } else {
        list.push({
          site_name: p,
          status: 'missing',
          has_cookies: false,
          created_at: 'never',
          proxy_binding: 'none',
        });
      }
    }

    return list;
  }

  /**
   * Invalidate or delete session
   */
  static invalidateSession(siteName: string): boolean {
    const siteKey = siteName.toLowerCase();
    const existing = sessionCache.get(siteKey);
    if (existing) {
      existing.status = 'expired';
      sqliteService.saveProviderSession(existing as DbProviderSession);
      return true;
    }
    return false;
  }
}
