/**
 * Run read-only SQL against DATABASE_URL (loads frontend/.env.local + backend/.env).
 * Usage: node scripts/db-query.cjs "SELECT 1"
 */
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { config: loadEnv } = require('dotenv');
const { Pool } = require('pg');

const root = resolve(__dirname, '..');
for (const file of [
  'frontend/.env.local',
  'frontend/.env',
  'backend/.env.local',
  'backend/.env',
  'backend/.env.staging',
]) {
  const path = resolve(root, file);
  if (existsSync(path)) loadEnv({ path, override: true });
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = process.argv.slice(2).join(' ');
if (!sql) {
  console.error('Usage: node scripts/db-query.cjs "<SQL>"');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: url });
  try {
    const result = await pool.query(sql);
    console.log(JSON.stringify(result.rows, null, 2));
    console.log(`(${result.rowCount} row(s))`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
