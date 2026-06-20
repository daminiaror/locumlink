/**
 * Split orphaned host_profile off a LOCUM user: create HOST user row, reassign profile.
 * Loads DATABASE_URL from frontend/.env.local + backend/.env.
 */
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { randomBytes } = require('node:crypto');
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

function cuidLike() {
  const t = Date.now().toString(36);
  const r = randomBytes(8).toString('hex');
  return `c${t}${r}`.slice(0, 25);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orphans = await client.query(`
      SELECT u.id AS locum_user_id, u.email, u."passwordHash", u.status,
             u."emailVerified", u."emailVerifiedAt", u."consent_given_at",
             u."consent_version", u."lastLoginAt",
             hp.id AS host_profile_id
      FROM users u
      JOIN host_profiles hp ON hp."userId" = u.id
      WHERE u.role = 'LOCUM'
    `);

    if (orphans.rows.length === 0) {
      console.log(JSON.stringify({ fixed: 0, message: 'No orphaned host_profiles on LOCUM users.' }, null, 2));
      await client.query('COMMIT');
      return;
    }

    const results = [];
    for (const row of orphans.rows) {
      const existingHost = await client.query(
        `SELECT id FROM users WHERE email = $1 AND role = 'HOST' LIMIT 1`,
        [row.email],
      );

      let hostUserId;
      if (existingHost.rows.length > 0) {
        hostUserId = existingHost.rows[0].id;
      } else {
        hostUserId = cuidLike();
        await client.query(
          `INSERT INTO users (
            id, email, "passwordHash", role, status, "emailVerified", "emailVerifiedAt",
            "consent_given_at", "consent_version", "lastLoginAt", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, 'HOST', $4, $5, $6, $7, $8, $9, NOW(), NOW()
          )`,
          [
            hostUserId,
            row.email,
            row.passwordHash,
            row.status,
            row.emailVerified,
            row.emailVerifiedAt,
            row.consent_given_at,
            row.consent_version,
            row.lastLoginAt,
          ],
        );
      }

      await client.query(
        `UPDATE host_profiles SET "userId" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [hostUserId, row.host_profile_id],
      );

      results.push({
        email: row.email,
        locumUserId: row.locum_user_id,
        hostUserId,
        hostProfileId: row.host_profile_id,
        hostUserCreated: existingHost.rows.length === 0,
      });
    }

    await client.query('COMMIT');
    console.log(JSON.stringify({ fixed: results.length, results }, null, 2));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
