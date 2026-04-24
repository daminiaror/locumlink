'use client';
import { useEffect } from 'react';
import { syncCookies } from '@/lib/auth';
export function AuthSync() {
    useEffect(() => {
        syncCookies();
        function onFocus() {
            syncCookies();
        }
        function onVisibility() {
            if (document.visibilityState === 'visible')
                syncCookies();
        }
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);
    return null;
}
