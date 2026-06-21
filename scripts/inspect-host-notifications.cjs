const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { config } = require('dotenv');
const { Pool } = require('pg');

const root = resolve(__dirname, '..');
for (const file of ['frontend/.env.local', 'backend/.env', 'backend/.env.staging']) {
  const p = resolve(root, file);
  if (existsSync(p)) config({ path: p, override: true });
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const hostNotifs = await client.query(`
      SELECT ne.id, ne."eventType", ne."recipientId", ne."deliveryStatus", ne."sentAt",
             u.email, u.role
      FROM notification_events ne
      JOIN users u ON u.id = ne."recipientId"
      WHERE ne."eventType" LIKE 'H_%'
      ORDER BY ne."sentAt" DESC
      LIMIT 15
    `);
    console.log('Recent H_* notifications:', JSON.stringify(hostNotifs.rows, null, 2));

    const hosts = await client.query(`
      SELECT hp.id AS host_profile_id, hp."userId", u.email, u.role,
             (SELECT COUNT(*)::int FROM notification_events ne WHERE ne."recipientId" = hp."userId") AS notif_count
      FROM host_profiles hp
      JOIN users u ON u.id = hp."userId"
      ORDER BY notif_count DESC
      LIMIT 10
    `);
    console.log('Host profiles + notif counts:', JSON.stringify(hosts.rows, null, 2));

    const apps = await client.query(`
      SELECT a.id, a.status, jp.title, hp."userId" AS host_user_id,
             hu.email AS host_email, hu.role AS host_role, a."appliedAt"
      FROM applications a
      JOIN job_postings jp ON jp.id = a."jobPostingId"
      JOIN host_profiles hp ON hp.id = jp."hostProfileId"
      JOIN users hu ON hu.id = hp."userId"
      ORDER BY a."appliedAt" DESC
      LIMIT 10
    `);
    console.log('Recent applications:', JSON.stringify(apps.rows, null, 2));

    const h001 = await client.query(`
      SELECT ne.id, ne."recipientId", u.email, u.role, ne."referenceId"
      FROM notification_events ne
      JOIN users u ON u.id = ne."recipientId"
      WHERE ne."eventType" = 'H_001_LOCUM_APPLIED'
      ORDER BY ne."sentAt" DESC
      LIMIT 10
    `);
    console.log('H_001 notifications:', JSON.stringify(h001.rows, null, 2));

    const dupUsers = await client.query(`
      SELECT id, email, role, status, "createdAt"
      FROM users
      WHERE email ILIKE '%aroradamini873%'
      ORDER BY role
    `);
    console.log('Users with host email:', JSON.stringify(dupUsers.rows, null, 2));

    const wrongHostProfiles = await client.query(`
      SELECT hp.id, hp."userId", u.role, u.email
      FROM host_profiles hp
      JOIN users u ON u.id = hp."userId"
      WHERE u.role <> 'HOST'
    `);
    console.log('host_profiles on non-HOST users:', JSON.stringify(wrongHostProfiles.rows, null, 2));

    const wrongHostNotifs = await client.query(`
      SELECT ne.id, ne."eventType", ne."recipientId", u.role, u.email
      FROM notification_events ne
      JOIN users u ON u.id = ne."recipientId"
      WHERE ne."eventType" LIKE 'H_%' AND u.role <> 'HOST'
    `);
    console.log('H_* notifications on non-HOST users:', JSON.stringify(wrongHostNotifs.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
