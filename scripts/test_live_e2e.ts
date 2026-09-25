import { DatabaseSync } from 'node:sqlite';
import { LiveProviderIntegration } from '../server/services/liveIntegration.js';
import { createSearchSession } from '../server/services/flightSearch.js';
import { sqliteService } from '../server/services/sqliteDb.js';

async function main() {
  console.log('--- 1. Resetting alibaba session to clean state ---');
  const db = new DatabaseSync('data/torob.sqlite');
  db.prepare("UPDATE provider_sessions SET cookies = '' WHERE site_name = 'alibaba'").run();

  console.log('--- 2. Executing createSearchSession for THR-MHD on 2026-09-26 ---');
  const session = await createSearchSession({
    origin: { code: 'THR', name: 'Tehran' },
    destination: { code: 'MHD', name: 'Mashhad' },
    departureDate: '2026-09-26',
    cabin: 'economy'
  });

  console.log('Session ID:', session.id);
  console.log('Status:', session.status);
  console.log('Origin / Destination:', session.origin, '->', session.destination);
  console.log('Grouped cards count:', session.groupedCards.length);
  console.log('Raw offers count:', session.rawOffersCount);

  if (session.groupedCards.length > 0) {
    console.log('Sample flight cards:');
    session.groupedCards.slice(0, 5).forEach((card, idx) => {
      console.log(`[${idx + 1}] Airline: ${card.airline?.nameFa || card.airline?.name} (${card.airline?.iata}) | Flight: ${card.flightNumber} | Dep: ${card.departureAt} | Lowest: ${card.bestPrice?.totalPrice?.toLocaleString()} Rial | Providers: ${card.providers?.map(p => `${p.providerName}: ${p.totalPrice.toLocaleString()}`).join(', ')}`);
    });
  }

  console.log('\n--- 3. Verifying SQLite persistence ---');
  const recentSearches = sqliteService.getRecentSearches(5);
  console.log('SQLite recent searches count:', recentSearches.length);
  if (recentSearches.length > 0) {
    console.log('Most recent search:', recentSearches[0]);
  }

  const alibabaSession = sqliteService.getProviderSession('alibaba');
  console.log('SQLite Alibaba session updated cookies:', alibabaSession?.cookies?.substring(0, 60) + '...');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
