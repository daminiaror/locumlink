import type { INestApplication } from '@nestjs/common';
import {
  closeTestApp,
  createTestApp,
  type TestAppContext,
} from '../setup/test-app';
import { cleanupTables } from '../helpers/db';
import { expiredToken } from '../helpers/auth';
import { authedAgent } from '../helpers/http';
import { createAdminUser, createLocumUser } from '../factories/user.factory';

describe('Journey 4 — Auth and access control', () => {
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

  it('returns 401 for unauthenticated GET /api/locum/jobs', async () => {
    await ctx.agent.get('/api/locum/jobs').expect(401);
  });

  /**
   * Actual behavior: locum has no host profile → 404 Not Found
   * ("Host profile not found. Please complete your profile first.")
   */
  it('returns 404 when locum accesses host-only route GET /api/host/jobs', async () => {
    const locum = await createLocumUser();
    const http = authedAgent(ctx.agent, locum.token);
    const res = await http.get('/api/host/jobs').expect(404);
    expect(res.body.message).toMatch(/host profile not found/i);
  });

  it('returns accessToken and refreshToken on valid login', async () => {
    const locum = await createLocumUser();

    const res = await ctx.agent
      .post('/api/auth/login')
      .send({ email: locum.user.email, password: locum.password })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }),
    );
  });

  it('returns 401 on login with wrong password', async () => {
    const locum = await createLocumUser();

    await ctx.agent
      .post('/api/auth/login')
      .send({ email: locum.user.email, password: 'WrongPass1!' })
      .expect(401);
  });

  it('returns 401 when using an expired token', async () => {
    const locum = await createLocumUser();
    const token = expiredToken(locum.user.id, locum.user.role, locum.user.email);

    await ctx.agent
      .get('/api/locum/jobs')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('allows ADMIN role user to authenticate and receive tokens', async () => {
    const admin = await createAdminUser();

    const res = await ctx.agent
      .post('/api/auth/login')
      .send({ email: admin.user.email, password: admin.password })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));

    const http = authedAgent(ctx.agent, res.body.accessToken);
    await http.get('/api/auth/me').expect(200);
  });

  it('returns 401 for host route with no token', async () => {
    await ctx.agent.get('/api/host/jobs').expect(401);
  });
});
