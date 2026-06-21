/**
 * Ensure Docker Postgres is up for E2E tests (port 5433, database l2_test).
 * Usage: node scripts/prepare-e2e-db.cjs
 */
const { execSync, spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { Client } = require('pg');

const repoRoot = resolve(__dirname, '..');
const testUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5433/l2_test?schema=public';

function dockerOk() {
  const r = spawnSync('docker', ['info'], { stdio: 'ignore' });
  return r.status === 0;
}

async function pgReady(url) {
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 3000 });
  try {
    await c.connect();
    await c.query('SELECT 1');
    await c.end();
    return true;
  } catch {
    try {
      await c.end();
    } catch {}
    return false;
  }
}

async function main() {
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';

  if (!(await pgReady(adminUrl.toString()))) {
    console.log('[prepare-e2e-db] Postgres not reachable on 5433');
    if (!dockerOk()) {
      console.error(
        '[prepare-e2e-db] Docker daemon is not running. Start Docker Desktop, then run:',
      );
      console.error('  docker compose up -d postgres');
      process.exit(1);
    }
    console.log('[prepare-e2e-db] Starting docker compose postgres...');
    execSync('docker compose up -d postgres', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    for (let i = 0; i < 30; i++) {
      if (await pgReady(adminUrl.toString())) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (!(await pgReady(adminUrl.toString()))) {
      console.error('[prepare-e2e-db] Postgres still not ready after 60s');
      process.exit(1);
    }
  }

  const dbName = new URL(testUrl).pathname.replace(/^\//, '').split('?')[0];
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[prepare-e2e-db] Created database "${dbName}"`);
    } else {
      console.log(`[prepare-e2e-db] Database "${dbName}" already exists`);
    }
  } finally {
    await admin.end();
  }

  console.log('[prepare-e2e-db] Ready:', testUrl.replace(/:[^:@]+@/, ':****@'));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
