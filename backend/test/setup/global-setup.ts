import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const backendRoot = resolve(__dirname, '../..');
const repoRoot = resolve(backendRoot, '..');
const envTestPath = resolve(backendRoot, '.env.test');

export default async function globalSetup(): Promise<void> {
  if (!existsSync(envTestPath)) {
    throw new Error(`Missing ${envTestPath}. Copy from backend/.env.test.example.`);
  }

  loadEnv({ path: envTestPath, override: true });

  const testDatabaseUrl =
    process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set in .env.test');
  }

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDatabaseUrl;

  const url = new URL(testDatabaseUrl);
  const dbName = url.pathname.replace(/^\//, '').split('?')[0];
  const adminUrl = new URL(testDatabaseUrl);
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[global-setup] Created database "${dbName}"`);
    }
  } finally {
    await admin.end();
  }

  const schemaPath = resolve(repoRoot, 'database/prisma/schema.prisma');
  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: 'inherit',
  });

  console.log('[global-setup] Migrations applied to test database');
}
