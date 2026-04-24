'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useFirstVisit } from '@/hooks/useFirstVisit';
import { tourSteps } from '@/config/tourSteps';
function resolveTourSteps() {
    return tourSteps.filter((s) => typeof s.element === 'string' &&
        s.element.length > 0 &&
        document.querySelector(s.element));
}
export default function GuidedTour() {
    const { isFirstVisit, markAsSeen } = useFirstVisit();
    const pathname = usePathname();
    const launchedRef = useRef(false);
    const driverRef = useRef<ReturnType<typeof driver> | null>(null);
    useEffect(() => {
        if (!isFirstVisit || launchedRef.current)
            return;
        const resolved = resolveTourSteps();
        if (resolved.length === 0)
            return;
        launchedRef.current = true;
        try {
            const driverObj = driver({
                showProgress: true,
                allowClose: true,
                onDestroyed: () => {
                    driverRef.current = null;
                    markAsSeen();
                },
                steps: resolved,
            });
            driverRef.current = driverObj;
            driverObj.drive();
        }
        catch {
            launchedRef.current = false;
            return;
        }
        return () => {
            if (driverRef.current) {
                try {
                    driverRef.current.destroy();
                }
                catch {
                }
                driverRef.current = null;
            }
            launchedRef.current = false;
        };
    }, [isFirstVisit, markAsSeen, pathname]);
    return null;
}
