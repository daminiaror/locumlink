'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authApi } from '@/lib/api';
import { getSupabase } from '@/lib/supabaseClient';
import {
  saveToken,
  saveRole,
  saveEmail,
  getRole,
  clearAuth,
  syncCookies,
  markProfileComplete,
  isProfileComplete,
  popLastPath,
  type Role,
} from '@/lib/auth';

interface AuthCtx {
  userId: string | null;
  role: Role | null;
  isLoading: boolean;
  profileComplete: boolean;
  sendOtp: (email: string, role: Role) => Promise<void>;
  verifyOtp: (
    email: string,
    otp: string,
  ) => Promise<{ role: Role; redirectTo: string }>;
  completeProfile: () => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

/** Key used both in localStorage (via markProfileComplete) and as a cookie
 *  so the middleware can read it server-side after a full-page navigation. */
const PROFILE_COMPLETE_COOKIE = 'll_profile_complete';

/** Write a long-lived cookie readable by the middleware (no HttpOnly so JS
 *  can also set/clear it; middleware only reads, never writes). */
function setProfileCompleteCookie(value: boolean) {
  if (typeof document === 'undefined') return;
  if (value) {
    document.cookie = `${PROFILE_COMPLETE_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax`;
  } else {
    // Expire the cookie immediately on logout
    document.cookie = `${PROFILE_COMPLETE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/** Swap Supabase access token for Nest JWT so /api/* guards accept the session. */
async function syncNestAccessToken(): Promise<void> {
  const role = getRole() ?? 'locum';
  try {
    const out = await authApi.syncFromSupabase(role);
    saveToken(out.accessToken);
    syncCookies();
  } catch {
    // Already a Nest JWT or backend missing SUPABASE_SERVICE_ROLE_KEY
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRoleState] = useState<Role | null>(null);
  const [isLoading, setLoading] = useState(true);

  /** Read localStorage synchronously so children never see a false flash
   *  after setup (full page load). */
  const [profileComplete, setProfileComplete] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isProfileComplete();
  });

  useEffect(() => {
    // Re-hydrate cookies from localStorage so middleware works after page refresh
    syncCookies();

    const storedRole = getRole();
    if (storedRole) setRoleState(storedRole);

    const complete = isProfileComplete();
    setProfileComplete(complete);
    // ── FIX 1: Always keep the profile-complete cookie in sync with
    //    localStorage on every page load so the middleware never loses it. ──
    setProfileCompleteCookie(complete);

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.access_token) {
          saveToken(session.access_token);
          await syncNestAccessToken();
          setUserId(session.user.id);
          syncCookies();
          setProfileCompleteCookie(isProfileComplete());
        }
        setLoading(false);
      });

      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          saveToken(session.access_token);
          void (async () => {
            await syncNestAccessToken();
            setUserId(session.user.id);
            syncCookies();
            setProfileCompleteCookie(isProfileComplete());
          })();
        } else if (!session) {
          setUserId(null);
          setProfileCompleteCookie(false);
        }
      });
      subscription = sub;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function sendOtp(email: string, chosenRole: Role): Promise<void> {
    saveRole(chosenRole);
    setRoleState(chosenRole);
    saveEmail(email);
    const { error } = await getSupabase().auth.signInWithOtp({ email });
    if (error) throw error;
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  async function verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ role: Role; redirectTo: string }> {
    const { data, error } = await getSupabase().auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    if (error) throw error;

    const token = data.session?.access_token;
    if (!token) throw new Error('No access token returned from Supabase');

    saveToken(token);
    await syncNestAccessToken();
    setUserId(data.user?.id ?? null);

    const savedRole = getRole() ?? 'locum';

    const lastPath = popLastPath();
    const redirectTo = lastPath ?? '/home';

    return { role: savedRole, redirectTo };
  }

  function completeProfile(): void {
    markProfileComplete();          // writes to localStorage
    setProfileCompleteCookie(true); // ── FIX 3: also write the cookie so the
                                    //    middleware sees it on the very next
                                    //    request (full-page navigation to
                                    //    /host/dashboard after setup finishes)
    syncCookies();                  // mirror JWT + role to cookies
    setProfileComplete(true);       // update React state
  }

  function logout(): void {
    clearAuth();
    setProfileCompleteCookie(false); // clear the cookie on logout
    void getSupabase().auth.signOut();
    setUserId(null);
    setRoleState(null);
    setProfileComplete(false);
  }

  return (
    <Ctx.Provider
      value={{
        userId,
        role,
        isLoading,
        profileComplete,
        sendOtp,
        verifyOtp,
        completeProfile,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}