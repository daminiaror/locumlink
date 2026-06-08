import type { INestApplication } from '@nestjs/common';
import {
  closeTestApp,
  createTestApp,
  type TestAppContext,
} from '../setup/test-app';
import { cleanupTables, getTestDb } from '../helpers/db';
import { authedAgent } from '../helpers/http';
import { createHostUser, createLocumUser } from '../factories/user.factory';
import {
  createJobPosting,
  futureCalendarDate,
} from '../factories/job.factory';
import { PostingStatus } from '@prisma/client';

describe('Journey 1 — Locum browses and applies for a job', () => {
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

  it('lists ACTIVE jobs with pagination shape', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    await createJobPosting(host.hostProfileId, { status: PostingStatus.ACTIVE });
    await createJobPosting(host.hostProfileId, {
      status: PostingStatus.DRAFT,
      title: 'Hidden Draft',
    });

    const http = authedAgent(ctx.agent, locum.token);
    const res = await http.get('/api/locum/jobs?limit=10').expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        nextCursor: expect.anything(),
        hasNextPage: expect.any(Boolean),
      }),
    );
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    for (const item of res.body.items) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          status: 'ACTIVE',
        }),
      );
    }
    expect(
      res.body.items.some((j: { title: string }) => j.title === 'Hidden Draft'),
    ).toBe(false);
  });

  it('applies to a job → 201, application APPLIED in DB', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
    });

    const http = authedAgent(ctx.agent, locum.token);
    const res = await http
      .post(`/api/locum/jobs/${job.id}/apply`, { coverNote: 'Interested' })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        application: expect.objectContaining({
          id: expect.any(String),
          jobPostingId: job.id,
          status: 'APPLIED',
        }),
      }),
    );

    const db = getTestDb();
    const row = await db.application.findFirst({
      where: { jobPostingId: job.id, locumProfileId: locum.locumProfileId },
    });
    expect(row).not.toBeNull();
    expect(row?.status).toBe('APPLIED');
  });

  it('returns 400 when applying twice to the same job', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
    });

    const http = authedAgent(ctx.agent, locum.token);
    await http.post(`/api/locum/jobs/${job.id}/apply`).expect(201);
    const second = await http.post(`/api/locum/jobs/${job.id}/apply`).expect(400);

    expect(second.body.message).toMatch(/already applied/i);

    const count = await getTestDb().application.count({
      where: { jobPostingId: job.id },
    });
    expect(count).toBe(1);
  });

  it('returns 400 when applying to a DRAFT job', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.DRAFT,
    });

    const http = authedAgent(ctx.agent, locum.token);
    const res = await http
      .post(`/api/locum/jobs/${job.id}/apply`)
      .expect(400);

    expect(res.body.message).toMatch(/no longer accepting/i);

    const count = await getTestDb().application.count({
      where: { jobPostingId: job.id },
    });
    expect(count).toBe(0);
  });

  it('returns 400 when applying to an EXPIRED job', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.EXPIRED,
      startDate: new Date(`${futureCalendarDate(-30)}T00:00:00.000Z`),
      endDate: new Date(`${futureCalendarDate(-23)}T00:00:00.000Z`),
    });

    const http = authedAgent(ctx.agent, locum.token);
    await http.post(`/api/locum/jobs/${job.id}/apply`).expect(400);

    const count = await getTestDb().application.count({
      where: { jobPostingId: job.id },
    });
    expect(count).toBe(0);
  });
});
