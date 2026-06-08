import type { INestApplication } from '@nestjs/common';
import {
  closeTestApp,
  createTestApp,
  type TestAppContext,
} from '../setup/test-app';
import { cleanupTables, getTestDb } from '../helpers/db';
import { authedAgent } from '../helpers/http';
import { createHostUser, createLocumUser } from '../factories/user.factory';
import { createJobPosting, buildCreateJobPayload } from '../factories/job.factory';
import { createApplication } from '../factories/application.factory';
import { ApplicationStatus, PostingStatus } from '@prisma/client';

describe('Journey 2 — Host manages their job posting', () => {
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

  it('creates a job posting as DRAFT in DB', async () => {
    const host = await createHostUser();
    const http = authedAgent(ctx.agent, host.token);

    const res = await http
      .post('/api/host/jobs', buildCreateJobPayload({ saveAsDraft: true }))
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        job: expect.objectContaining({
          id: expect.any(String),
          title: 'New Host Job',
          status: 'DRAFT',
        }),
      }),
    );

    const db = getTestDb();
    const row = await db.jobPosting.findUnique({
      where: { id: res.body.job.id },
    });
    expect(row?.status).toBe(PostingStatus.DRAFT);
    expect(row?.hostProfileId).toBe(host.hostProfileId);
  });

  it('publishes a DRAFT job → ACTIVE in DB', async () => {
    const host = await createHostUser();
    const http = authedAgent(ctx.agent, host.token);

    const created = await http
      .post('/api/host/jobs', buildCreateJobPayload({ saveAsDraft: true }))
      .expect(201);

    const jobId = created.body.job.id as string;

    await http
      .patch(`/api/host/jobs/${jobId}`, { status: 'ACTIVE' })
      .expect(200);

    const row = await getTestDb().jobPosting.findUnique({ where: { id: jobId } });
    expect(row?.status).toBe(PostingStatus.ACTIVE);
  });

  it('lists applications only for the host own job', async () => {
    const host = await createHostUser();
    const otherHost = await createHostUser();
    const locum = await createLocumUser();

    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
    });
    await createJobPosting(otherHost.hostProfileId, {
      status: PostingStatus.ACTIVE,
      title: 'Other host job',
    });
    await createApplication({
      jobPostingId: job.id,
      locumProfileId: locum.locumProfileId,
      status: ApplicationStatus.APPLIED,
    });

    const http = authedAgent(ctx.agent, host.token);
    const res = await http
      .get(`/api/host/jobs/${job.id}/applications`)
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            status: 'APPLIED',
            locumProfile: expect.objectContaining({
              firstName: expect.any(String),
            }),
          }),
        ]),
        nextCursor: expect.anything(),
        hasNextPage: expect.any(Boolean),
      }),
    );
    expect(res.body.items).toHaveLength(1);
  });

  it('shortlists an applicant → SHORTLISTED in DB', async () => {
    const host = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(host.hostProfileId, {
      status: PostingStatus.ACTIVE,
    });
    const application = await createApplication({
      jobPostingId: job.id,
      locumProfileId: locum.locumProfileId,
    });

    const http = authedAgent(ctx.agent, host.token);
    const res = await http
      .patch(`/api/host/jobs/${job.id}/applications/${application.id}`, {
        status: 'SHORTLISTED',
      })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        application: expect.objectContaining({ status: 'SHORTLISTED' }),
      }),
    );

    const row = await getTestDb().application.findUnique({
      where: { id: application.id },
    });
    expect(row?.status).toBe(ApplicationStatus.SHORTLISTED);
  });

  /**
   * Actual behavior: another host with their own profile gets 403 Forbidden
   * (job exists but hostProfileId mismatch), not 404.
   */
  it('returns 403 when a different host accesses another host job applications', async () => {
    const owner = await createHostUser();
    const intruder = await createHostUser();
    const locum = await createLocumUser();
    const job = await createJobPosting(owner.hostProfileId, {
      status: PostingStatus.ACTIVE,
    });
    await createApplication({
      jobPostingId: job.id,
      locumProfileId: locum.locumProfileId,
    });

    const http = authedAgent(ctx.agent, intruder.token);
    await http.get(`/api/host/jobs/${job.id}/applications`).expect(403);
  });
});
