'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Provider, Session } from '@supabase/supabase-js';
import { authApi } from '@/lib/api';
import {
  createClient,
  formatSupabaseNetworkError,
  getSupabase,
} from '@/lib/supabase/client';
import {
  saveToken,
  saveRole,
  saveEmail,
  getRole,
  getToken,
  clearAuth,
  syncCookies,
  markProfileComplete,
  isProfileComplete,
  syncProfileCompleteCookies,
  clearProfileCompleteCookies,
  popLastPath,
  clearLastPath,
  type Role,
} from '@/lib/auth';

interface AuthCtx {
  userId: string | null;
  role: Role | null;
  isLoading: boolean;
  profileComplete: boolean;
  sendOtp: (email: string, role: Role) => Promise<void>;
  signInWithOAuth: (provider: Provider, role: Role) => Promise<void>;
  completeOAuthSignIn: () => Promise<{ role: Role; redirectTo: string }>;
  verifyOtp: (
    email: string,
    otp: string,
  ) => Promise<{ role: Role; redirectTo: string }>;
  completeProfile: () => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const NEST_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

async function syncNestAccessToken(): Promise<boolean> {
  const role = getRole() ?? 'locum';
  try {
    const out = await authApi.syncFromSupabase(role);
    saveToken(out.accessToken);
    syncCookies();
    return true;
  } catch {
    return false;
  }
}

async function checkProfileExistsOnServer(
  role: Role,
  token: string,
): Promise<boolean> {
  try {
    const endpoint =
      role === 'clinic'
        ? `${NEST_BASE}/api/host/profile`
        : `${NEST_BASE}/api/locum/profile`;

    const res = await fetch(endpoint, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const d = (await res.json()) as { exists: boolean };
    return d.exists === true;
  } catch {
    return false;
  }
}

async function finishAppSignIn(
  session: Session,
  setUserId: (id: string | null) => void,
  setProfileComplete: (done: boolean) => void,
): Promise<{ role: Role; redirectTo: string }> {
  const token = session.access_token;
  if (!token) throw new Error('No access token returned from Supabase');

  saveToken(token);
  syncCookies();

  const synced = await syncNestAccessToken();
  if (!synced) {
    throw new Error(
      'Could not sign you in to the app API. Check that the backend is running on NEXT_PUBLIC_API_URL and that backend/.env.staging uses the same Supabase URL and anon key as frontend/.env.local.',
    );
  }

  setUserId(session.user?.id ?? null);

  const savedRole = (getRole() ?? 'locum') as Role;
  const nestToken = getToken() ?? token;
  const profileExists = await checkProfileExistsOnServer(savedRole, nestToken);

  let redirectTo: string;

  if (profileExists) {
    markProfileComplete();
    syncCookies();
    syncProfileCompleteCookies();
    setProfileComplete(true);
    const lastPath = popLastPath();
    redirectTo =
      lastPath ??
      (savedRole === 'clinic' ? '/host/dashboard' : '/locum/dashboard');
  } else {
    clearLastPath();
    redirectTo = savedRole === 'clinic' ? '/host/setup' : '/locum/setup';
  }

  return { role: savedRole, redirectTo };
}

async function finishDevAppSignIn(
  accessToken: string,
  setUserId: (id: string | null) => void,
  setProfileComplete: (done: boolean) => void,
): Promise<{ role: Role; redirectTo: string }> {
  saveToken(accessToken);
  syncCookies();

  const savedRole = (getRole() ?? 'locum') as Role;
  try {
    const me = await authApi.getMe();
    setUserId(me.id);
  } catch {
    setUserId(null);
  }

  const profileExists = await checkProfileExistsOnServer(savedRole, accessToken);
  let redirectTo: string;

  if (profileExists) {
    markProfileComplete();
    syncCookies();
    syncProfileCompleteCookies();
    setProfileComplete(true);
    const lastPath = popLastPath();
    redirectTo =
      lastPath ??
      (savedRole === 'clinic' ? '/host/dashboard' : '/locum/dashboard');
  } else {
    clearLastPath();
    redirectTo = savedRole === 'clinic' ? '/host/setup' : '/locum/setup';
  }

  return { role: savedRole, redirectTo };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRoleState] = useState<Role | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isProfileComplete();
  });

  useEffect(() => {
    syncCookies();

    const storedRole = getRole();
    if (storedRole) setRoleState(storedRole);

    const complete = isProfileComplete();
    setProfileComplete(complete);
    syncProfileCompleteCookies();

    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = getSupabase();

      // Restore existing session on mount
      supabase.auth
        .getSession()
        .then(async ({ data: { session } }) => {
          try {
            if (session?.access_token) {
              if (!getRole()) saveRole('locum');
              saveToken(session.access_token);
              await syncNestAccessToken();
              setUserId(session.user.id);
              syncCookies();
              const currentComplete = isProfileComplete();
              setProfileComplete(currentComplete);
              syncProfileCompleteCookies();
            } else if (getToken()) {
              const me = await authApi.getMe();
              setUserId(me.id);
              syncCookies();
              const currentComplete = isProfileComplete();
              setProfileComplete(currentComplete);
              syncProfileCompleteCookies();
            }
          } catch (e) {
            console.error('[AuthProvider] getSession sync error:', e);
          } finally {
            setLoading(false);
          }
        })
        .catch((e) => {
          console.error('[AuthProvider] getSession error:', e);
          setLoading(false);
        });

      // Listen for token refreshes and sign-out events
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          if (!getRole()) saveRole('locum');
          saveToken(session.access_token);
          void (async () => {
            await syncNestAccessToken();
            setUserId(session.user.id);
            syncCookies();
            const currentComplete = isProfileComplete();
            setProfileComplete(currentComplete);
            syncProfileCompleteCookies();
          })();
        } else if (!session) {
          if (getToken()) {
            void authApi
              .getMe()
              .then((me) => {
                setUserId(me.id);
                syncCookies();
              })
              .catch(() => {
                setUserId(null);
              });
          } else {
            setUserId(null);
            setProfileComplete(false);
            clearProfileCompleteCookies();
          }
        }
      });

      subscription = sub;
    } catch (e) {
      console.error('[AuthProvider] init error:', e);
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  // ── Auth actions ────────────────────────────────────────────────────────

  async function sendOtp(email: string, chosenRole: Role): Promise<void> {
    saveRole(chosenRole);
    setRoleState(chosenRole);
    saveEmail(email);

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw formatSupabaseNetworkError(error);
  }

  async function signInWithOAuth(
    provider: Provider,
    chosenRole: Role,
  ): Promise<void> {
    saveRole(chosenRole);
    setRoleState(chosenRole);
    syncCookies();

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw formatSupabaseNetworkError(error);
  }

  async function completeOAuthSignIn(): Promise<{
    role: Role;
    redirectTo: string;
  }> {
    const { data, error } = await getSupabase().auth.getSession();
    if (error) throw formatSupabaseNetworkError(error);
    if (!data.session)
      throw new Error(
        'No Supabase session found after OAuth sign-in. Check the provider redirect URL in Supabase.',
      );
    return finishAppSignIn(data.session, setUserId, setProfileComplete);
  }

  async function verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ role: Role; redirectTo: string }> {
    const isDevBypass = otp === '000000';

    if (isDevBypass) {
      const savedRole = (getRole() ?? 'locum') as Role;
      const { accessToken } = await authApi.devOtpLogin(email, savedRole);
      return finishDevAppSignIn(accessToken, setUserId, setProfileComplete);
    }

    throw new Error('Invalid code. For this demo, use 000000.');

  }

  function completeProfile(): void {
    markProfileComplete();
    syncCookies();
    syncProfileCompleteCookies();
    setProfileComplete(true);
  }

  function logout(): void {
    clearAuth();
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
        signInWithOAuth,
        completeOAuthSignIn,
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
