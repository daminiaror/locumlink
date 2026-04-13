/**
 * This project uses backend-issued JWTs in the `ll_access` cookie (see middleware),
 * not NextAuth. API routes should call `getAuthenticatedUserId` or
 * `getAuthenticatedHostUserId` from `@/lib/auth-server`.
 *
 * The filename is kept so older snippets that mention `authOptions` can be updated
 * to import from `auth-server` instead.
 */
export {
  getAuthenticatedUserId,
  getAuthenticatedHostUserId,
} from './auth-server';
