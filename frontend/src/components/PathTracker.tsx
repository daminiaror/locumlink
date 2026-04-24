'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { saveLastPath } from '@/lib/auth';
export function PathTracker() {
    const pathname = usePathname();
    useEffect(() => {
        saveLastPath(pathname);
    }, [pathname]);
    return null;
}
