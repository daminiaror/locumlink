import { sign } from 'jsonwebtoken';
import type { Role } from '@prisma/client';

const JWT_SECRET =
  process.env.JWT_SECRET ??
  'test-jwt-secret-at-least-32-characters-long-for-integration';

export function signAccessToken(
  userId: string,
  role: Role,
  email = 'test@example.com',
): string {
  return sign({ sub: userId, email, role }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function expiredToken(
  userId: string,
  role: Role,
  email = 'test@example.com',
): string {
  return sign({ sub: userId, email, role }, JWT_SECRET, {
    expiresIn: '-1s',
  });
}
