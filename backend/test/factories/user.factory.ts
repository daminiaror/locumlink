import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus, type User } from '@prisma/client';
import { getTestDb } from '../helpers/db';
import { signAccessToken } from '../helpers/auth';
import { createVerifiedHostProfile, createVerifiedLocumProfile } from './profile.factory';

export const DEFAULT_TEST_PASSWORD = 'TestPass1!';

export type CreatedUser = {
  user: User;
  token: string;
  password: string;
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@integration.test`;
}

export async function createLocumUser(
  overrides: Partial<{ email: string; password: string; status: UserStatus }> = {},
): Promise<CreatedUser & { locumProfileId: string }> {
  const db = getTestDb();
  const password = overrides.password ?? DEFAULT_TEST_PASSWORD;
  const user = await db.user.create({
    data: {
      email: overrides.email ?? uniqueEmail('locum'),
      passwordHash: await hashPassword(password),
      role: Role.LOCUM,
      status: overrides.status ?? UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  const profile = await createVerifiedLocumProfile(user.id);
  return {
    user,
    token: signAccessToken(user.id, user.role, user.email),
    password,
    locumProfileId: profile.id,
  };
}

export async function createHostUser(
  overrides: Partial<{ email: string; password: string; status: UserStatus }> = {},
): Promise<CreatedUser & { hostProfileId: string }> {
  const db = getTestDb();
  const password = overrides.password ?? DEFAULT_TEST_PASSWORD;
  const user = await db.user.create({
    data: {
      email: overrides.email ?? uniqueEmail('host'),
      passwordHash: await hashPassword(password),
      role: Role.HOST,
      status: overrides.status ?? UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  const profile = await createVerifiedHostProfile(user.id);
  return {
    user,
    token: signAccessToken(user.id, user.role, user.email),
    password,
    hostProfileId: profile.id,
  };
}

export async function createAdminUser(
  overrides: Partial<{ email: string; password: string }> = {},
): Promise<CreatedUser> {
  const db = getTestDb();
  const password = overrides.password ?? DEFAULT_TEST_PASSWORD;
  const user = await db.user.create({
    data: {
      email: overrides.email ?? uniqueEmail('admin'),
      passwordHash: await hashPassword(password),
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  return {
    user,
    token: signAccessToken(user.id, user.role, user.email),
    password,
  };
}
