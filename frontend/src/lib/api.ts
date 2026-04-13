import type { HostProfile, LocumProfile } from '@/types';
import type { Role } from '@/lib/auth';
import { getToken } from '@/lib/auth';

/**
 * Nest API (default dev: http://localhost:3000). Next.js runs on :3001.
 * Override with NEXT_PUBLIC_API_URL in production.
 */
const NEST_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** Same-origin Next Route Handlers, e.g. /api/host/profile */
const NEXT_BASE = '';

function nestHeaders(json: boolean): HeadersInit {
  const token = getToken();
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// ─── Auth (Nest) ─────────────────────────────────────────────────────────────

export const authApi = {
  /** Exchange Supabase (or existing) token for Locum Link JWTs. */
  syncFromSupabase: async (
    role: Role,
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await fetch(`${NEST_BASE}/api/auth/sync-supabase`, {
      method: 'POST',
      headers: nestHeaders(true),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `sync-supabase failed: ${res.status}`);
    }
    return res.json() as Promise<{ accessToken: string; refreshToken: string }>;
  },
};

// ─── Locum (Nest) ────────────────────────────────────────────────────────────

export const locumApi = {
  getProfile: async (): Promise<{
    exists: boolean;
    profile: LocumProfile | null;
  }> => {
    const res = await fetch(`${NEST_BASE}/api/locum/profile`, {
      cache: 'no-store',
      headers: nestHeaders(false),
    });
    if (!res.ok) throw new Error(`getProfile failed: ${res.status}`);
    return res.json() as Promise<{ exists: boolean; profile: LocumProfile | null }>;
  },

  saveProfile: async (data: LocumProfile): Promise<unknown> => {
    const res = await fetch(`${NEST_BASE}/api/locum/profile`, {
      method: 'POST',
      headers: nestHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`saveProfile failed: ${res.status}`);
    return res.json();
  },
};

// ─── Host: Next route (profile) + Nest (jobs) ────────────────────────────────

export interface CreateJobPayload {
  title: string;
  description?: string;
  location?: string;
  expiresAt?: string;
  servicesRequired?: string[];
  isRural?: boolean;
  accommodationProvided?: boolean;
}

export const hostApi = {
  getProfile: async (): Promise<HostProfile | null> => {
    const res = await fetch(`${NEXT_BASE}/api/host/profile`, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`getProfile failed: ${res.status}`);
    return res.json() as Promise<HostProfile>;
  },

  saveProfile: async (data: HostProfile): Promise<HostProfile> => {
    const res = await fetch(`${NEXT_BASE}/api/host/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`saveProfile failed: ${res.status}`);
    return res.json() as Promise<HostProfile>;
  },

  createJob: async (body: CreateJobPayload): Promise<unknown> => {
    const res = await fetch(`${NEST_BASE}/api/host/jobs`, {
      method: 'POST',
      headers: nestHeaders(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `createJob failed: ${res.status}`);
    }
    return res.json();
  },
};
