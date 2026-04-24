'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { saveLastPath } from '@/lib/auth';
export function useTrackLastPath(): void {
    const pathname = usePathname();
    useEffect(() => {
        if (!pathname)
            return;
        saveLastPath(pathname);
    }, [pathname]);
}
