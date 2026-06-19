import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { ensureAdminEnv } from '@/lib/ensure-admin-env';
import { logger } from '@/lib/logger';

export interface AdminSession {
  adminId: string;
  actorEmail: string;
}

export async function getAdminSession(
  request?: Request,
): Promise<AdminSession | null> {
  ensureAdminEnv();
  const secret =
    process.env.ADMIN_JWT_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!secret) {
    logger.error('[admin-auth] ADMIN_JWT_SECRET or JWT_SECRET must be set', {
      meta: 'admin-auth',
    });
    return null;
  }
  let token = (await cookies()).get('ll_admin')?.value ?? null;
  if (!token && request) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader.match(/(?:^|;\s*)ll_admin=([^;]+)/);
    if (match?.[1]) {
      try {
        token = decodeURIComponent(match[1]);
      } catch {
        token = match[1];
      }
    }
  }
  if (!token) {
    logger.warn('Admin auth: no token found', { meta: 'admin-auth' });
    return null;
  }
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    if (payload.role !== 'admin') {
      logger.warn('Admin auth: token role is not admin', {
        meta: 'admin-auth',
        role: String(payload.role ?? 'unknown'),
      });
      return null;
    }
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    const actorEmail =
      typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    logger.info('Admin auth: session verified', {
      meta: 'admin-auth',
      adminId: payload.sub,
      actorEmail,
    });
    return {
      adminId: payload.sub,
      actorEmail,
    };
  } catch {
    logger.error('Admin auth: JWT verification failed', { meta: 'admin-auth' });
    return null;
  }
}

export async function requireAdmin(
  request?: Request,
): Promise<AdminSession | null> {
  return getAdminSession(request);
}
