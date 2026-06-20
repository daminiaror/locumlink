import type { INestApplication } from '@nestjs/common';
import {
  closeTestApp,
  createTestApp,
  type TestAppContext,
} from '../setup/test-app';
import { cleanupTables, getTestDb } from '../helpers/db';
import { authedAgent } from '../helpers/http';
import { createHostUser, createLocumUser } from '../factories/user.factory';
import { createJobPosting } from '../factories/job.factory';
import { PostingStatus } from '@prisma/client';

function todayUtcDate(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function utcHmFromNow(offsetMinutes: number): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

async function browseJobIds(token: string, ctx: TestAppContext): Promise<Set<string>> {
  const http = authedAgent(ctx.agent, token);
  const res = await http.get('/api/locum/jobs?limit=100').expect(200);
  return new Set(
    (res.body.items as Array<{ id: string }>).map((j) => j.id),
  );
}

describe('Journey — Locum browse shift start filter', () => {
  let ctx: TestAppContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  afterEach(async () => {
    await cleanupTables();
  });

  it('GET /api/locum/jobs returns 200 (shift-filter SQL path)', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    await createJobPosting(host.hostProfileId, { status: PostingStatus.ACTIVE });

    const http = authedAgent(ctx.agent, locum.token);
    await http.get('/api/locum/jobs?limit=10').expect(200);
  });

  it('includes ACTIVE jobs whose shift start is still in the future', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const futureTime = utcHmFromNow(90);
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
      title: 'Future shift job',
      startDate: todayUtcDate(),
      startTime: futureTime,
    });

    const ids = await browseJobIds(locum.token, ctx);
    expect(ids.has(job.id)).toBe(true);
  });

  it('excludes ACTIVE jobs whose shift start has passed', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const pastTime = utcHmFromNow(-90);
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
      title: 'Past shift job',
      startDate: todayUtcDate(),
      startTime: pastTime,
    });

    const ids = await browseJobIds(locum.token, ctx);
    expect(ids.has(job.id)).toBe(false);
  });

  it('keeps jobs with start_date but null start_time visible until end of that UTC day', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
      title: 'Date only job',
      startDate: todayUtcDate(),
      startTime: null,
    });

    const ids = await browseJobIds(locum.token, ctx);
    expect(ids.has(job.id)).toBe(true);

    const db = getTestDb();
    const rows = await db.$queryRaw<Array<{ is_active: boolean }>>`
      SELECT (
        start_date::timestamp + TIME '23:59:59'
      ) > NOW() AS is_active
      FROM job_postings
      WHERE id = ${job.id}
    `;
    expect(rows[0]?.is_active).toBe(true);
  });

  it('always includes jobs with null start_date', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
      title: 'No start date job',
      startDate: null,
      startTime: '00:00',
    });

    const ids = await browseJobIds(locum.token, ctx);
    expect(ids.has(job.id)).toBe(true);
  });

  it('drops a near-future job after start_time is moved into the past', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const futureTime = utcHmFromNow(45);
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
      title: 'Transition job',
      startDate: todayUtcDate(),
      startTime: futureTime,
    });

    const before = await browseJobIds(locum.token, ctx);
    expect(before.has(job.id)).toBe(true);

    const db = getTestDb();
    await db.jobPosting.update({
      where: { id: job.id },
      data: { startTime: utcHmFromNow(-5) },
    });

    const after = await browseJobIds(locum.token, ctx);
    expect(after.has(job.id)).toBe(false);
  });
});
