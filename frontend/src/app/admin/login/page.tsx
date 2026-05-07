'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthSplitLayout from '@/components/AuthSplitLayout';
import Logo from '@/components/Logo';
import { adminApiBase } from '@/lib/adminApi';

function AdminLoginInner() {
  const sp = useSearchParams();
  const error = sp.get('error');
  const reason = sp.get('reason');
  const reasonText = useMemo(() => {
    if (!reason) return '';
    try {
      return decodeURIComponent(reason);
    }
    catch {
      return reason;
    }
  }, [reason]);
  const [busy, setBusy] = useState(false);

  function continueWithGoogle() {
    const base = adminApiBase().replace(/\/$/, '');
    const path = `${base}/api/admin-auth/google`;
    setBusy(true);
    window.location.assign(path.startsWith('/') ? path : `${path}`);
  }

  const showDenied = error === 'not_allowed';
  const showOAuthFail = error === 'oauth';

  return (
    <AuthSplitLayout variant="signup">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo size="md" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F2A7A', marginBottom: 6 }}>
            Admin Login
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.4 }}>
            Sign in with Google through the Nest API (<code style={{ fontSize: 13 }}>GOOGLE_ADMIN_*</code> in{' '}
            <code style={{ fontSize: 13 }}>backend/.env</code>), separate from the main app&apos;s Supabase Google. Your
            email must exist in the <code style={{ fontSize: 13 }}>admins</code> table ({' '}
            <code style={{ fontSize: 11 }}>database/seed-admin.mjs</code> ).
          </div>
        </div>

        {showOAuthFail ? (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              color: '#991B1B',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              lineHeight: 1.4,
              fontWeight: 700,
            }}
          >
            Google redirect failed or access was cancelled. In Google Cloud → OAuth client, set Authorized redirect URI
            to{' '}
            <code style={{ fontSize: 11 }}>http://localhost:3000/api/admin-auth/google/callback</code> (and your
            production API callback).
            {reason ? (
              <>
                <br />
                <span style={{ fontWeight: 600 }}>Detail:</span> {reasonText}
              </>
            ) : null}
          </div>
        ) : null}

        {showDenied ? (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              color: '#991B1B',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              lineHeight: 1.4,
              fontWeight: 700,
            }}
          >
            This signed-in Google account is not in the admins list. Ask a developer to run{' '}
            <code style={{ fontSize: 12 }}>database/seed-admin.mjs</code> with your email.
            {reasonText ? (
              <>
                <br />
                <span style={{ fontWeight: 600 }}>Detail:</span> {reasonText}
              </>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => continueWithGoogle()}
          style={{
            height: 46,
            borderRadius: 12,
            border: '1px solid rgba(15, 42, 122, 0.18)',
            background: '#fff',
            cursor: busy ? 'wait' : 'pointer',
            opacity: busy ? 0.75 : 1,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 800,
            color: '#0F2A7A',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'rgba(56, 198, 198, 0.18)',
              border: '1px solid rgba(56, 198, 198, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#0F2A7A',
              fontWeight: 900,
            }}
          >
            G
          </span>
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 1.4 }}>
          Main-app users continue to use Supabase for Google OAuth. Admin uses only the backend OAuth client credentials.
        </div>
      </div>
    </AuthSplitLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <AuthSplitLayout variant="signup">
          <div style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>Loading…</div>
        </AuthSplitLayout>
      }
    >
      <AdminLoginInner />
    </Suspense>
  );
}
