'use client';

/** Match `frontend/src/lib/api.ts`: browser uses same-origin + Next rewrites unless env overrides. */
export function adminApiBase(): string {
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  }
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (j?.message !== undefined && typeof j.message === 'string') return j.message;
    if (Array.isArray(j?.message))
      return j.message.join(', ');
  }
    catch {}
  try {
    return await res.text();
  }
 catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function adminFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${adminApiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function adminDownloadUsersCsv(q: string): Promise<void> {
  const qs = new URLSearchParams();
  if (q.trim()) qs.set('q', q.trim());
  const res = await fetch(
    `${adminApiBase()}/api/admin/users/export?${qs.toString()}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error(await parseError(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users.csv';
  a.click();
  URL.revokeObjectURL(url);
}
