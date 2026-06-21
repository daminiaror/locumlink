const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const files = [
  'backend/.env',
  'backend/.env.staging',
  'backend/.env.local',
  'frontend/.env.local',
];

for (const file of files) {
  const p = resolve(__dirname, '..', file);
  if (!existsSync(p)) continue;
  console.log(`\n=== ${file} ===`);
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (/^(TEST_|DATABASE|JWT_|NODE_ENV|PORT|POSTGRES)/i.test(line) && !line.trim().startsWith('#')) {
      if (/password|secret|key|token/i.test(line) && line.includes('=')) {
        const [k] = line.split('=');
        console.log(`${k}=<redacted>`);
      } else {
        console.log(line);
      }
    }
  }
}
