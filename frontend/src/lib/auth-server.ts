import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export interface SessionJwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Returns the authenticated user id from the `ll_access` JWT cookie (same secret as Nest).
 * This app does not use NextAuth — use this in Route Handlers instead of getServerSession.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set');
    return null;
  }

  const token = (await cookies()).get('ll_access')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const sub = payload.sub;
    if (typeof sub !== 'string' || !sub) return null;
    return sub;
  } catch {
    return null;
  }
}

export async function getAuthenticatedHostUserId(): Promise<string | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const token = (await cookies()).get('ll_access')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const sub = payload.sub;
    const role = payload.role;
    if (typeof sub !== 'string' || !sub) return null;
    if (role !== 'HOST') return null;
    return sub;
  } catch {
    return null;
  }
}
