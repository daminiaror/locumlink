/**
 * Verify locum browse shift-start filter against live DATABASE_URL.
 * Usage: node scripts/verify-browse-shift-filter.cjs [--wait-ms=120000]
 *
 * Creates temporary ACTIVE job postings, checks browseShiftStartActiveSql,
 * optionally waits for a near-future shift to expire, then cleans up.
 */
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { randomUUID } = require('node:crypto');
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

const waitArg = process.argv.find((a) => a.startsWith('--wait-ms='));
const waitMs = waitArg ? Number(waitArg.split('=')[1]) : 0;

const SHIFT_ACTIVE_SQL = `(
  start_date IS NULL
  OR (
    start_date::timestamp
    + COALESCE(
        NULLIF(
          substring(COALESCE(start_time, '') FROM '^([0-9]{1,2}:[0-9]{2})'),
          ''
        )::time,
        TIME '23:59:59'
      )
  ) > NOW()
)`;

function todayUtcDateStr() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function utcHmFromNow(offsetMin) {
  const d = new Date(Date.now() + offsetMin * 60_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

async function isBrowseActive(client, jobId) {
  const { rows } = await client.query(
    `SELECT id FROM job_postings
     WHERE id = $1
       AND status = 'ACTIVE'::"PostingStatus"
       AND is_deleted = false
       AND ${SHIFT_ACTIVE_SQL}`,
    [jobId],
  );
  return rows.length > 0;
}

async function insertJob(client, hostProfileId, fields) {
  const id = `verify-${randomUUID()}`;
  await client.query(
    `INSERT INTO job_postings (
      id, "hostProfileId", title, description, "servicesRequired",
      status, location, is_deleted, start_date, start_time, end_date,
      key_responsibilities, required_credentials, "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, '', '{}', 'ACTIVE'::"PostingStatus", 'Verify City', false,
      $4::date, $5, $4::date, '{}', '{}', NOW(), NOW()
    )`,
    [id, hostProfileId, fields.title, fields.startDate, fields.startTime],
  );
  return id;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  const createdIds = [];

  try {
    const tz = await client.query('SHOW timezone');
    console.log('Postgres timezone:', tz.rows[0]?.TimeZone);

    const formats = await client.query(
      `SELECT start_time, COUNT(*)::int AS n
       FROM job_postings
       WHERE start_time IS NOT NULL
       GROUP BY start_time
       ORDER BY n DESC
       LIMIT 15`,
    );
    console.log('\nDistinct start_time values (sample):');
    for (const row of formats.rows) {
      const m = String(row.start_time).match(/^([0-9]{1,2}:[0-9]{2})/);
      console.log(
        `  ${JSON.stringify(row.start_time)} (n=${row.n}) regex=${m ? 'match' : 'NO MATCH → 23:59:59 fallback'}`,
      );
    }

    const host = await client.query(`SELECT id FROM host_profiles LIMIT 1`);
    if (host.rows.length === 0) {
      console.error('No host_profiles row — cannot insert test jobs.');
      process.exit(1);
    }
    const hostProfileId = host.rows[0].id;
    const today = todayUtcDateStr();

    const futureMin = waitMs > 0 ? Math.ceil(waitMs / 60_000) + 1 : 3;
    const futureTime = utcHmFromNow(futureMin);
    const pastTime = utcHmFromNow(-3);

    const futureId = await insertJob(client, hostProfileId, {
      title: 'verify-future-shift',
      startDate: today,
      startTime: futureTime,
    });
    createdIds.push(futureId);

    const pastId = await insertJob(client, hostProfileId, {
      title: 'verify-past-shift',
      startDate: today,
      startTime: pastTime,
    });
    createdIds.push(pastId);

    const nullTimeId = await insertJob(client, hostProfileId, {
      title: 'verify-null-time',
      startDate: today,
      startTime: null,
    });
    createdIds.push(nullTimeId);

    const nullDateId = await insertJob(client, hostProfileId, {
      title: 'verify-null-date',
      startDate: null,
      startTime: '12:00',
    });
    createdIds.push(nullDateId);

    console.log('\nInitial filter results:');
    console.log('  future shift visible:', await isBrowseActive(client, futureId));
    console.log('  past shift visible:', await isBrowseActive(client, pastId));
    console.log('  null start_time visible:', await isBrowseActive(client, nullTimeId));
    console.log('  null start_date visible:', await isBrowseActive(client, nullDateId));

    const okInitial =
      (await isBrowseActive(client, futureId)) === true &&
      (await isBrowseActive(client, pastId)) === false &&
      (await isBrowseActive(client, nullTimeId)) === true &&
      (await isBrowseActive(client, nullDateId)) === true;

    if (!okInitial) {
      console.error('\nFAIL: initial filter checks did not match expectations.');
      process.exit(1);
    }

    if (waitMs > 0) {
      console.log(`\nWaiting ${waitMs}ms for future shift (${futureTime} UTC) to pass...`);
      await new Promise((r) => setTimeout(r, waitMs));
      const stillVisible = await isBrowseActive(client, futureId);
      console.log('  future shift visible after wait:', stillVisible);
      if (stillVisible) {
        console.error('\nFAIL: future job still visible after wait.');
        process.exit(1);
      }
    } else {
      console.log('\nSkip live wait (pass --wait-ms=N to test time transition).');
    }

    console.log('\nPASS: browse shift filter behaves as expected.');
  } finally {
    if (createdIds.length > 0) {
      await client.query(
        `DELETE FROM job_postings WHERE id = ANY($1::text[])`,
        [createdIds],
      );
      console.log(`\nCleaned up ${createdIds.length} test job(s).`);
    }
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
