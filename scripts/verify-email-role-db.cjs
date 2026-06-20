/**
 * Integration checks for email+role identity (uses DATABASE_URL from env files).
 * Creates temporary rows and removes them — does not TRUNCATE production data.
 */
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { randomUUID } = require('node:crypto');
const { config: loadEnv } = require('dotenv');
const bcrypt = require('bcrypt');
const { PrismaClient, Role } = require('@prisma/client');

const root = resolve(__dirname, '..');
for (const file of [
  'frontend/.env.local',
  'backend/.env.local',
  'backend/.env',
]) {
  const path = resolve(root, file);
  if (existsSync(path)) loadEnv({ path, override: true });
}

const prisma = new PrismaClient();

async function cleanup(ids) {
  if (ids.userIds.length) {
    await prisma.hostProfile.deleteMany({
      where: { userId: { in: ids.userIds } },
    });
    await prisma.locumProfile.deleteMany({
      where: { userId: { in: ids.userIds } },
    });
    await prisma.otp.deleteMany({ where: { email: ids.email } });
    await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } });
  }
}

async function main() {
  const email = `verify-${randomUUID()}@integration.test`.toLowerCase();
  const passwordHash = await bcrypt.hash('TestPass1!', 12);
  const userIds = [];

  try {
    const locum = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.LOCUM,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    userIds.push(locum.id);

    const host = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.HOST,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    userIds.push(host.id);

    const rows = await prisma.user.findMany({ where: { email } });
    if (rows.length !== 2) {
      throw new Error(`Expected 2 users, got ${rows.length}`);
    }

    let duplicateFailed = false;
    try {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: Role.LOCUM,
          status: 'ACTIVE',
        },
      });
    } catch {
      duplicateFailed = true;
    }
    if (!duplicateFailed) {
      throw new Error('Expected duplicate (email, LOCUM) insert to fail');
    }

    const admin = await prisma.user.create({
      data: {
        email: `admin-${randomUUID()}@integration.test`.toLowerCase(),
        passwordHash,
        role: Role.ADMIN,
        status: 'ACTIVE',
      },
    });
    userIds.push(admin.id);

    const adminBlock = await prisma.user.findUnique({
      where: { email_role: { email: admin.email, role: Role.ADMIN } },
    });
    if (!adminBlock) throw new Error('Admin row missing');

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: [
            'same email HOST+LOCUM rows created',
            'duplicate same role rejected',
            'admin row created for block test',
          ],
          sampleEmail: email,
          userIds,
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanup({ email, userIds });
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
