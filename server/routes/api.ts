import { Router, Request, Response } from 'express';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { searchAirports } from '../services/airportSearch.js';
import {
  createSearchSession,
  getSearchSession,
  generateFlightGroupingKey,
  sortFlightCards,
  FlightSortOption,
} from '../services/flightSearch.js';
import { getAirports, getAirlines } from '../data/airports.js';
import { ProviderSessionService } from '../services/providerSessions.js';
import { LiveProviderIntegration } from '../services/liveIntegration.js';
import { IranProxyService } from '../services/iranProxyService.js';
import { sqliteService } from '../services/sqliteDb.js';

export function createApiRouter(): Router {
  const router = Router();

  // Health
  router.get('/health/live', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  router.get('/health/ready', (req: Request, res: Response) => {
    res.json({ status: 'ready' });
  });

  // Airport Search (with Persian normalization, IATA search, and city child groupings)
  router.get('/airports/search', (req: Request, res: Response) => {
    const q = String(req.query.q || '');
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    if (!q) {
      return res.json([]);
    }
    const results = searchAirports(q, limit);
    return res.json(results);
  });

  // Generate Grouping Key utility endpoint
  router.post('/search/group-key', (req: Request, res: Response) => {
    const { airlineCode, flightNumber, origin, destination, departureAt, cabin } = req.body || {};
    if (!flightNumber || !origin || !destination || !departureAt) {
      return res.status(400).json({
        error: 'Missing required parameters: flightNumber, origin, destination, departureAt',
      });
    }

    const { groupingKey, flightHash } = generateFlightGroupingKey({
      airlineCode: airlineCode || '',
      flightNumber,
      origin,
      destination,
      departureAt,
      cabin: cabin || 'economy',
    });

    res.json({
      groupingKey,
      flightHash,
      formula: 'FLIGHT_<AIRLINE>_<FLIGHT_NUM>_<ORIGIN>_<DESTINATION>_<DEP_TIME_MINUTES>_<CABIN>',
      attributes: {
        airlineCode,
        flightNumber,
        origin,
        destination,
        departureAt,
        cabin: cabin || 'economy',
      },
    });
  });

  // Flight Search (Alibaba, FlyToday, SafarMarket)
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const session = await createSearchSession(req.body);
      res.json({
        session_id: session.id,
        status: session.status,
        origin: session.origin,
        destination: session.destination,
        departure_date: session.departureDate,
        grouped_cards_count: session.groupedCards.length,
        raw_offers_count: session.rawOffersCount,
      });
    } catch (err: any) {
      console.error('[API /search error]:', err);
      res.status(500).json({ error: err.message || 'Search execution failed' });
    }
  });

  // SQLite Search History Endpoints
  router.get('/history/searches', (req: Request, res: Response) => {
    try {
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const searches = sqliteService.getRecentSearches(limit);
      res.json({
        success: true,
        total: searches.length,
        searches,
        db_source: 'data/torob.sqlite',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/history/searches/:id/offers', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const offers = sqliteService.getSearchOffersBySessionId(id);
      res.json({
        success: true,
        session_id: id,
        total_offers: offers.length,
        offers,
        db_source: 'data/torob.sqlite',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.delete('/history/searches/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      sqliteService.deleteSearchSession(id);
      res.json({ success: true, message: `Session ${id} deleted from SQLite history` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/search/:sessionId/offers', (req: Request, res: Response) => {
    const sessionId = Number(req.params.sessionId);
    const session = getSearchSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        session_id: sessionId,
      });
    }

    // Support the exact 3 sorting options: 'Fastest' | 'Cheapest' | 'Earliest'
    const sortParam = (String(req.query.sort || 'Cheapest').toLowerCase());
    let activeSort: FlightSortOption = 'Cheapest';
    if (sortParam === 'fastest') activeSort = 'Fastest';
    else if (sortParam === 'earliest') activeSort = 'Earliest';
    else activeSort = 'Cheapest';

    const sortedCards = sortFlightCards(session.groupedCards, activeSort);

    res.json({
      session_id: session.id,
      status: session.status,
      origin: session.origin,
      destination: session.destination,
      departure_date: session.departureDate,
      return_date: session.returnDate,
      trip_type: session.tripType,
      cabin: session.cabin,
      providers: session.providersRequested,
      raw_offers_count: session.rawOffersCount,
      sort: activeSort,
      allowed_sorts: ['Cheapest', 'Fastest', 'Earliest'],
      grouped_cards: sortedCards,
    });
  });

  // Database Bootstrap & Seed execution endpoint
  router.post('/bootstrap/run', (req: Request, res: Response) => {
    try {
      const baseDir = process.cwd();
      const pyBootstrap = path.join(baseDir, 'scripts', 'db_bootstrap.py');
      const pySeed = path.join(baseDir, 'scripts', 'db_seed_reference_data.py');

      const bootstrapLog = execSync(`python3 "${pyBootstrap}"`, { encoding: 'utf-8' });
      const seedLog = execSync(`python3 "${pySeed}"`, { encoding: 'utf-8' });

      res.json({
        success: true,
        message: 'Database schema bootstrapped and reference data seeded successfully',
        bootstrapLog,
        seedLog,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Bootstrap script failed',
      });
    }
  });

  // DB and Reference Data status
  router.get('/bootstrap/status', (req: Request, res: Response) => {
    const dbPath = path.resolve(process.cwd(), 'data/torob.sqlite');
    const dbExists = fs.existsSync(dbPath);
    let dbSize = 0;
    if (dbExists) {
      dbSize = fs.statSync(dbPath).size;
    }

    const airportsCount = getAirports().length;
    const airlinesCount = getAirlines().length;

    res.json({
      db_file: 'data/torob.sqlite',
      db_exists: dbExists,
      db_size_bytes: dbSize,
      airports_raw_count: airportsCount,
      airlines_raw_count: airlinesCount,
      providers: ['alibaba', 'flytoday', 'safarmarket'],
      status: 'ready',
    });
  });

  // System module statuses
  router.get('/reference-data/status', (req: Request, res: Response) => {
    const airportsCount = getAirports().length;
    const airlinesCount = getAirlines().length;
    res.json({
      module: 'reference_data',
      airports_count: airportsCount,
      airlines_count: airlinesCount,
      status: 'ready',
    });
  });

  // ==========================================
  // Crawler Provider Sessions & Integrations
  // ==========================================

  // Get status of all provider sessions & credentials
  router.get('/integrations/sessions', (req: Request, res: Response) => {
    const sessions = ProviderSessionService.getAllSessions();
    res.json({
      success: true,
      sessions,
      supported_providers: ['alibaba', 'flytoday', 'safarmarket'],
      sync_endpoint: '/api/v1/integrations/sync-session',
      message: 'Active sessions enable real live crawler querying from provider APIs',
    });
  });

  // Sync / ingest provider session credentials from generate_sessions.py
  router.post('/integrations/sync-session', async (req: Request, res: Response) => {
    try {
      const {
        site_name,
        session_id,
        flow_id,
        cookies,
        headers,
        session_storage,
        local_storage,
        proxy_binding,
        expires_at,
      } = req.body || {};

      if (!site_name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: site_name (e.g. alibaba, flytoday, safarmarket)',
        });
      }

      const saved = await ProviderSessionService.saveSession({
        site_name,
        session_id,
        flow_id,
        status: 'active',
        cookies: typeof cookies === 'object' ? JSON.stringify(cookies) : cookies,
        headers,
        session_storage,
        local_storage,
        proxy_binding,
        expires_at,
        created_at: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: `Successfully synchronized session credentials for ${site_name}`,
        session: {
          site_name: saved.site_name,
          status: saved.status,
          has_cookies: Boolean(saved.cookies),
          proxy_binding: saved.proxy_binding || 'direct',
          created_at: saved.created_at,
          expires_at: saved.expires_at,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to sync provider session',
      });
    }
  });

  // Test / run live search for a specific provider
  router.post('/integrations/test-live-search', async (req: Request, res: Response) => {
    const { provider, origin, destination, departureDate, cabin } = req.body || {};
    if (!provider || !origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: provider, origin, destination',
      });
    }

    const result = await LiveProviderIntegration.searchProvider(
      provider,
      origin,
      destination,
      departureDate || new Date().toISOString().slice(0, 10),
      cabin || 'economy'
    );

    return res.json({
      success: true,
      result,
    });
  });

  // Automatically refresh cookies and credentials for providers via Iran proxy
  router.post('/integrations/auto-refresh-session', async (req: Request, res: Response) => {
    try {
      const { provider } = req.body || {};
      if (provider && ['alibaba', 'flytoday', 'safarmarket'].includes(provider)) {
        const session = await LiveProviderIntegration.autoRefreshSession(provider);
        return res.json({
          success: true,
          message: `اعتبارنامه‌ها و کوکی‌های ${provider} با موفقیت از طریق پروکسی ایران بروزرسانی شدند`,
          session,
        });
      } else {
        const sessions = await LiveProviderIntegration.autoRefreshAllProviders();
        return res.json({
          success: true,
          message: 'اعتبارنامه‌ها و کوکی‌های کلیه ارائه‌دهندگان (علی‌بابا، فلای‌تودی، سفرمارکت) بروزرسانی شدند',
          sessions,
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'خطا در بروزرسانی خودکار نشست‌ها',
      });
    }
  });

  // Get list of all Iran proxies & active proxy status
  router.get('/integrations/proxies', (req: Request, res: Response) => {
    const proxies = IranProxyService.getAllProxies();
    const activeProxy = IranProxyService.getActiveProxy();
    res.json({
      success: true,
      total: proxies.length,
      active_proxy: activeProxy,
      proxies,
    });
  });

  // Search and discover fresh Iranian proxies from public repos
  router.post('/integrations/proxies/search', async (req: Request, res: Response) => {
    try {
      const result = await IranProxyService.searchAndFetchIranProxies();
      const allProxies = IranProxyService.getAllProxies();
      res.json({
        success: true,
        message: `${result.fetched} پروکسی جدید ایرانی یافت و به لیست اضافه شد`,
        new_count: result.fetched,
        total_count: result.total,
        proxies: allProxies,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'خطا در واکشی پروکسی‌های ایران',
      });
    }
  });

  // Add custom residential / private Iran proxy
  router.post('/integrations/proxies/add', (req: Request, res: Response) => {
    const { url, provider } = req.body || {};
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'آدرس پروکسی (url) الزامی است (مثال: http://ip:port یا socks5://ip:port)',
      });
    }

    const added = IranProxyService.addCustomProxy({ url, provider, status: 'active' });
    res.json({
      success: true,
      message: 'پروکسی اختصاصی با موفقیت ثبت و فعال شد',
      proxy: added,
    });
  });

  // Test connection of an Iran proxy
  router.post('/integrations/proxies/test', async (req: Request, res: Response) => {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'آدرس پروکسی الزامی است',
      });
    }

    const result = await IranProxyService.testProxy(url);
    res.json({
      success: result.success,
      result,
    });
  });

  return router;
}
