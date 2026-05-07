import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let cachedEnvFingerprint: string | null = null;

function readPublicSupabaseEnv(): {
  url: string;
  anon: string;
} {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const anon =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
    || (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  return { url, anon };
}

export function isSupabasePlaceholderEnv(): boolean {
  const { url, anon } = readPublicSupabaseEnv();
  const placeholderAnon =
    /^your-supabase-anon-key$/i.test(anon) ||
    /^local-dev-anon-key$/i.test(anon);
  return url.includes('your-project-ref') || placeholderAnon;
}

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error(
      'createClient() must run in the browser. Use "@/lib/supabase/server" from server routes.',
    );
  }

  const { url, anon } = readPublicSupabaseEnv();
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Set in frontend/.env.local and restart Next.js.',
    );
  }

  if (isSupabasePlaceholderEnv()) {
    throw new Error(
      'Supabase env looks like a placeholder (e.g. local-dev-anon-key or http://127.0.0.1:54321 without real keys). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local to your hosted project (Dashboard -> Settings -> API), or use the URL and anon key from `supabase status` if you run `supabase start`. In Next.js, `.env.development.local` overrides `.env.local` - remove or fix it if present. Stop and restart `next dev` after any change (NEXT_PUBLIC_* is baked in at startup).',
    );
  }

  const fingerprint = `${url}\0${anon}`;
  if (client && cachedEnvFingerprint === fingerprint) {
    return client;
  }

  client = createBrowserClient(url, anon);
  cachedEnvFingerprint = fingerprint;
  return client;
}

export const getSupabase = createClient;

export function formatSupabaseNetworkError(err: unknown): Error {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)';
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        && typeof (err as { message: unknown }).message === 'string'
        ? (err as { message: string }).message
        : String(err);
  const looksLikeNetwork =
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(
      msg,
    );

  if (looksLikeNetwork) {
    const envHint = /127\.0\.0\.1:54321|localhost:54321/.test(baseUrl)
      ? ' If you expect hosted Supabase (https://....supabase.co) but see localhost here, check frontend/.env.development.local (it overrides .env.local), then fully stop and restart `next dev`.'
      : '';
    return new Error(
      `Cannot reach Supabase at ${baseUrl}. If you use the local stack, run \`supabase start\` and match URL/anon key to \`supabase status\`. For hosted Supabase, use your project URL from the dashboard.${envHint}`,
    );
  }

  if (err instanceof Error) return err;
  return new Error(msg);
}

/** Supabase OAuth sometimes throws plain objects ({ message }); normalize for UI */
export function toReadableAuthError(err: unknown): Error {
  const asError =
    err instanceof Error
      ? err
      : typeof err === 'object' && err !== null && 'message' in err
        && typeof (err as { message: unknown }).message === 'string'
        ? new Error((err as { message: string }).message)
        : new Error(typeof err === 'string' ? err : JSON.stringify(err));
  return formatSupabaseNetworkError(asError);
}
