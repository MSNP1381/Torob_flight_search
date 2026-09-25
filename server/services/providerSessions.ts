/**
 * Provider Session Store
 * Handles in-memory caching and Firebase Firestore synchronization of crawler cookies/credentials
 */

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

// Firebase Firestore direct REST persistence helper for Node backend
const FIRESTORE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'stately-talon-qvk22';
const FIRESTORE_DATABASE_ID = 'ai-studio-buyomainbackend-22dd8ddc-455b-4fe8-8185-5d962f901b14';

export class ProviderSessionService {
  /**
   * Save or update a provider session/cookie set
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

    // Save to Firestore via REST API if configured
    try {
      await this.persistToFirestore(siteKey, record);
    } catch (err) {
      console.warn(`[ProviderSession] Notice: could not persist to Firestore (${(err as Error).message}), cached in memory.`);
    }

    return record;
  }

  /**
   * Get active session for a specific provider
   */
  static async getActiveSession(siteName: string): Promise<ProviderSessionData | null> {
    const siteKey = siteName.toLowerCase();
    
    // Check in-memory cache first
    const cached = sessionCache.get(siteKey);
    if (cached && cached.status === 'active') {
      // Check expiry if defined
      if (cached.expires_at) {
        const exp = new Date(cached.expires_at).getTime();
        if (Date.now() > exp) {
          cached.status = 'expired';
          return null;
        }
      }
      return cached;
    }

    // Try fetching from Firestore
    try {
      const fromDb = await this.fetchFromFirestore(siteKey);
      if (fromDb) {
        sessionCache.set(siteKey, fromDb);
        return fromDb;
      }
    } catch (err) {
      // Non-blocking
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
      const s = sessionCache.get(p);
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
      return true;
    }
    return false;
  }

  // --- Firestore REST Helper ---
  private static async persistToFirestore(siteKey: string, session: ProviderSessionData): Promise<void> {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/provider_sessions/${siteKey}`;
    
    // Convert object to Firestore document format
    const fields: Record<string, any> = {
      site_name: { stringValue: session.site_name },
      status: { stringValue: session.status },
      created_at: { stringValue: session.created_at },
      last_used_at: { stringValue: session.last_used_at || session.created_at },
    };

    if (session.session_id) fields.session_id = { stringValue: session.session_id };
    if (session.flow_id) fields.flow_id = { stringValue: session.flow_id };
    if (session.auth_state) fields.auth_state = { stringValue: session.auth_state };
    if (session.proxy_binding) fields.proxy_binding = { stringValue: session.proxy_binding };
    if (session.expires_at) fields.expires_at = { stringValue: session.expires_at };
    if (session.cookies) fields.cookies = { stringValue: typeof session.cookies === 'string' ? session.cookies : JSON.stringify(session.cookies) };
    if (session.headers) fields.headers = { stringValue: typeof session.headers === 'string' ? session.headers : JSON.stringify(session.headers) };
    if (session.session_storage) fields.session_storage = { stringValue: typeof session.session_storage === 'string' ? session.session_storage : JSON.stringify(session.session_storage) };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      throw new Error(`Firestore REST HTTP ${res.status}`);
    }
  }

  private static async fetchFromFirestore(siteKey: string): Promise<ProviderSessionData | null> {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/provider_sessions/${siteKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const doc = await res.json();
    if (!doc || !doc.fields) return null;

    const f = doc.fields;
    return {
      site_name: f.site_name?.stringValue || siteKey,
      session_id: f.session_id?.stringValue,
      status: (f.status?.stringValue as any) || 'active',
      cookies: f.cookies?.stringValue,
      headers: f.headers?.stringValue ? JSON.parse(f.headers.stringValue) : undefined,
      session_storage: f.session_storage?.stringValue ? JSON.parse(f.session_storage.stringValue) : undefined,
      expires_at: f.expires_at?.stringValue,
      created_at: f.created_at?.stringValue || new Date().toISOString(),
      proxy_binding: f.proxy_binding?.stringValue,
    };
  }
}
