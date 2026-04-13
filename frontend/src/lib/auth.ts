export type Role = 'clinic' | 'locum';

const TOKEN_KEY = 'll_access';
const ROLE_KEY = 'll_role';
const EMAIL_KEY = 'll_email';
const LAST_PATH_KEY = 'll_last_path';

// ── Cookie helpers ────────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// ── Token ─────────────────────────────────────────────────────────────────────

/** Save JWT to localStorage AND mirror to cookie (middleware reads the cookie) */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  setCookie(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// ── Role ──────────────────────────────────────────────────────────────────────

export function saveRole(role: Role): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, role);
  setCookie(ROLE_KEY, role);
}

export function getRole(): Role | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ROLE_KEY) as Role | null;
}

// ── Email ─────────────────────────────────────────────────────────────────────

export function saveEmail(email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EMAIL_KEY, email);
}

export function getEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(EMAIL_KEY);
}

// ── Profile complete ──────────────────────────────────────────────────────────

export function markProfileComplete(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ll_profile_done', '1');
}

export function isProfileComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('ll_profile_done') === '1';
}

// ── Last visited path ─────────────────────────────────────────────────────────

/**
 * Save current path on every navigation inside the dashboard.
 * Ignores auth/home pages — those are not meaningful destinations.
 */
export function saveLastPath(path: string): void {
  if (typeof window === 'undefined') return;
  if (path === '/' || path.startsWith('/auth') || path.startsWith('/home'))
    return;
  localStorage.setItem(LAST_PATH_KEY, path);
}

/**
 * Read the last saved path and clear it immediately.
 * Returns null if nothing was saved.
 */
export function popLastPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = localStorage.getItem(LAST_PATH_KEY);
  localStorage.removeItem(LAST_PATH_KEY);
  return path;
}

// ── Re-sync cookies after page refresh ───────────────────────────────────────

export function syncCookies(): void {
  if (typeof window === 'undefined') return;
  const token = getToken();
  const role = getRole();
  if (token) setCookie(TOKEN_KEY, token);
  if (role) setCookie(ROLE_KEY, role);
}

// ── Clear session (401) — keeps `ll_profile_done` to avoid setup/home loops ─

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  [TOKEN_KEY, ROLE_KEY, EMAIL_KEY, LAST_PATH_KEY].forEach((k) =>
    localStorage.removeItem(k),
  );
  deleteCookie(TOKEN_KEY);
  deleteCookie(ROLE_KEY);
}

// ── Full sign-out (explicit logout) ─────────────────────────────────────────

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  clearSession();
  localStorage.removeItem('ll_profile_done');
  deleteCookie('ll_profile_complete');
}
