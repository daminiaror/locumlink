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

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(`
    SELECT u.id, u.email, u.role, hp.id AS host_profile_id,
           hp.cpsns_verification_status
    FROM users u
    LEFT JOIN host_profiles hp ON hp."userId" = u.id
    ORDER BY u.email, u.role
  `);
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
