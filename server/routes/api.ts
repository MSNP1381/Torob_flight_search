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
  router.post('/search', (req: Request, res: Response) => {
    const session = createSearchSession(req.body);
    res.json({
      session_id: session.id,
      status: session.status,
      origin: session.origin,
      destination: session.destination,
      departure_date: session.departureDate,
      grouped_cards_count: session.groupedCards.length,
      raw_offers_count: session.rawOffersCount,
    });
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
      route_notice: session.routeNotice,
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
    const dbPath = path.resolve(process.cwd(), 'data/buyo.sqlite');
    const dbExists = fs.existsSync(dbPath);
    let dbSize = 0;
    if (dbExists) {
      dbSize = fs.statSync(dbPath).size;
    }

    const airportsCount = getAirports().length;
    const airlinesCount = getAirlines().length;

    res.json({
      db_file: 'data/buyo.sqlite',
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

  return router;
}
