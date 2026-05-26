import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

let loaded = false;

/** Vars that must match the running Nest API for admin cookie verification and Prisma. */
const BACKEND_SYNC_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
] as const;

function resolveBackendDir(): string | null {
  const roots = [
    process.cwd(),
    resolve(process.cwd(), '..'),
    resolve(process.cwd(), '../..'),
  ];
  for (const root of roots) {
    const nested = resolve(root, 'backend');
    if (existsSync(resolve(nested, 'package.json'))) return nested;
    if (existsSync(resolve(root, 'package.json')) && root.endsWith('backend'))
      return root;
  }
  return null;
}

/**
 * Nest `start:dev` sets NODE_ENV=staging and loads backend/.env then backend/.env.staging.
 * Next API routes run with NODE_ENV=development — still load .env.staging so JWT matches.
 */
function backendEnvStack(backendDir: string): string[] {
  const paths = [resolve(backendDir, '.env')];
  const staging = resolve(backendDir, '.env.staging');
  if (existsSync(staging)) paths.push(staging);
  const local = resolve(backendDir, '.env.local');
  if (existsSync(local)) paths.push(local);
  return paths;
}

function applyParsedKeys(parsed: Record<string, string | undefined> | undefined): void {
  if (!parsed) return;
  for (const key of BACKEND_SYNC_KEYS) {
    const value = parsed[key]?.trim();
    if (value) process.env[key] = value;
  }
}

/** Load DATABASE_URL, JWT, and GCS vars from frontend + backend env files. */
export function ensureAdminEnv(): void {
  if (loaded) return;
  loaded = true;

  const roots = [
    process.cwd(),
    resolve(process.cwd(), '..'),
    resolve(process.cwd(), '../..'),
  ];

  for (const root of roots) {
    for (const file of ['.env.local', '.env', 'backend/.env']) {
      const path = resolve(root, file);
      if (existsSync(path)) loadEnv({ path, override: false });
    }
  }

  const backendDir = resolveBackendDir();
  if (!backendDir) return;

  // Dev API uses backend/.env then backend/.env.staging — not frontend placeholder JWT.
  let lastParsed: Record<string, string | undefined> | undefined;
  for (const path of backendEnvStack(backendDir)) {
    const result = loadEnv({ path, override: true });
    lastParsed = result.parsed ?? lastParsed;
    applyParsedKeys(result.parsed);
  }
  applyParsedKeys(lastParsed);
}
