export const ADMIN_JWT_STRATEGY = 'admin-jwt';
/** Passport Google OAuth for admin only (credentials in `backend/.env`, not Supabase). */
export const ADMIN_GOOGLE_STRATEGY = 'admin-google';
export const ADMIN_AUTH_COOKIE = 'll_admin';
export const ADMIN_AUTH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

