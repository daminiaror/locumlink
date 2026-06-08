'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthSplitLayout from '@/components/AuthSplitLayout';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthCallbackCompletePage() {
    const router = useRouter();
    const { completeOAuthSignIn } = useAuth();
    const [error, setError] = useState('');
    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const { redirectTo } = await completeOAuthSignIn();
                if (!cancelled)
                    router.replace(redirectTo);
            }
            catch (err: unknown) {
                if (!cancelled) {
                    setError(err instanceof Error
                        ? err.message
                        : 'Could not complete social sign-in. Please try again.');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [completeOAuthSignIn, router]);
    return (<AuthSplitLayout variant="signup">
      <h2 className="auth-callback-heading" style={{
            width: '100%',
            maxWidth: 376,
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            lineHeight: '100%',
            color: '#0A0A0A',
            marginBottom: 16,
        }}>
        Completing sign in
      </h2>
      <p className="auth-callback-text" style={{
            width: '100%',
            maxWidth: 376,
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            lineHeight: '140%',
            color: error ? '#dc2626' : '#4A4A4A',
            margin: 0,
        }}>
        {error || 'Please wait while we finish setting up your session.'}
      </p>
    </AuthSplitLayout>);
}
