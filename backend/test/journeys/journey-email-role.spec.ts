import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import {
  closeTestApp,
  createTestApp,
  type TestAppContext,
} from '../setup/test-app';
import { cleanupTables } from '../helpers/db';
import { getTestDb } from '../helpers/db';
import { DEFAULT_TEST_PASSWORD } from '../factories/user.factory';
import { USER_OTP_PURPOSE } from '../../src/admin-auth/admin-auth.constants.js';

describe('Journey — email + role identity', () => {
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

  it('allows two User rows for the same email with different roles via register', async () => {
    const email = `dual-role-${Date.now()}@integration.test`;
    const password = DEFAULT_TEST_PASSWORD;

    await ctx.agent
      .post('/api/auth/register')
      .send({
        email,
        password,
        role: Role.LOCUM,
        consentGiven: true,
      })
      .expect(201);

    await ctx.agent
      .post('/api/auth/register')
      .send({
        email,
        password,
        role: Role.HOST,
        consentGiven: true,
      })
      .expect(201);

    const db = getTestDb();
    const users = await db.user.findMany({
      where: { email: email.toLowerCase() },
      orderBy: { role: 'asc' },
    });
    expect(users).toHaveLength(2);
    expect(users.map((u) => u.role).sort()).toEqual([Role.HOST, Role.LOCUM]);
    expect(users[0].id).not.toBe(users[1].id);
  });

  it('rejects duplicate register for the same email and role', async () => {
    const email = `dup-role-${Date.now()}@integration.test`;
    const password = DEFAULT_TEST_PASSWORD;

    await ctx.agent
      .post('/api/auth/register')
      .send({ email, password, role: Role.LOCUM, consentGiven: true })
      .expect(201);

    await ctx.agent
      .post('/api/auth/register')
      .send({ email, password, role: Role.LOCUM, consentGiven: true })
      .expect(409);
  });

  it('reuses the same User row when OTP verify targets the same email and role', async () => {
    const email = `otp-reuse-${Date.now()}@integration.test`;
    const db = getTestDb();
    const passwordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 12);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: Role.HOST,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    await db.otp.create({
      data: {
        email: email.toLowerCase(),
        role: Role.HOST,
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        purpose: USER_OTP_PURPOSE,
      },
    });

    const res = await ctx.agent
      .post('/api/auth/verify-otp')
      .send({ email, otp: '123456', role: 'clinic' })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));

    const after = await db.user.findMany({
      where: { email: email.toLowerCase(), role: Role.HOST },
    });
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(user.id);
  });

  it('rejects HOST/LOCUM signup when an ADMIN User exists for that email', async () => {
    const email = `admin-block-${Date.now()}@integration.test`;
    const password = DEFAULT_TEST_PASSWORD;
    const db = getTestDb();
    await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
        role: Role.ADMIN,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    await ctx.agent
      .post('/api/auth/register')
      .send({ email, password, role: Role.HOST, consentGiven: true })
      .expect(403);

    await ctx.agent
      .post('/api/auth/register')
      .send({ email, password, role: Role.LOCUM, consentGiven: true })
      .expect(403);
  });

  it('login requires matching role for email+password', async () => {
    const email = `login-role-${Date.now()}@integration.test`;
    const password = DEFAULT_TEST_PASSWORD;

    await ctx.agent
      .post('/api/auth/register')
      .send({ email, password, role: Role.LOCUM, consentGiven: true })
      .expect(201);

    await ctx.agent
      .post('/api/auth/login')
      .send({ email, password, role: Role.HOST })
      .expect(401);

    await ctx.agent
      .post('/api/auth/login')
      .send({ email, password, role: Role.LOCUM })
      .expect(200);
  });
});
