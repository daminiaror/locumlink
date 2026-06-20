const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { config } = require('dotenv');

const root = resolve(__dirname, '..');
for (const file of [
  'backend/.env',
  'backend/.env.staging',
  'frontend/.env.local',
  'frontend/.env',
]) {
  const p = resolve(root, file);
  if (existsSync(p)) config({ path: p, override: false });
}

function describeUrl(name, url) {
  if (!url) {
    console.log(`${name}: (not set)`);
    return;
  }
  try {
    const u = new URL(url);
    console.log(
      `${name}: host=${u.hostname}:${u.port || '5432'} db=${u.pathname.replace(/^\//, '')}`,
    );
  } catch {
    console.log(`${name}: (invalid URL)`);
  }
}

describeUrl('DATABASE_URL', process.env.DATABASE_URL);
describeUrl('TEST_DATABASE_URL', process.env.TEST_DATABASE_URL);
