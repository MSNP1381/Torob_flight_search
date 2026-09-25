import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const BASE_DIR = process.cwd();
const PY_BOOTSTRAP = path.join(BASE_DIR, 'scripts', 'db_bootstrap.py');
const PY_SEED = path.join(BASE_DIR, 'scripts', 'db_seed_reference_data.py');

console.log('🚀 Running Torob Database Bootstrap & Reference Data Seeding...');

try {
  console.log('1. Executing schema bootstrap...');
  const bootstrapOut = execSync(`python3 "${PY_BOOTSTRAP}"`, { encoding: 'utf-8' });
  console.log(bootstrapOut);

  console.log('2. Executing reference data seeding from misc/airports.json & misc/airlines_complete.json...');
  const seedOut = execSync(`python3 "${PY_SEED}"`, { encoding: 'utf-8' });
  console.log(seedOut);

  console.log('✅ Database bootstrap and seed completed successfully!');
} catch (err: any) {
  console.error('❌ Bootstrap failed:', err.message);
  process.exit(1);
}
