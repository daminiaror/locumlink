'use client';
import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useFirstVisit } from '@/hooks/useFirstVisit';
import { tourSteps } from '@/config/tourSteps';

export default function GuidedTour() {
  const { isFirstVisit, markAsSeen } = useFirstVisit();

  useEffect(() => {
    if (!isFirstVisit) return;

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      onDestroyed: () => markAsSeen(),
      steps: tourSteps,
    });

    driverObj.drive();
  }, [isFirstVisit, markAsSeen]);

  return null;
}
