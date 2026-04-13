'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getRole, isProfileComplete, getEmail } from '@/lib/auth';
import { HomeLandingView } from '@/components/HomeLandingView';

export default function HomePage() {
  const router = useRouter();
  const [hasSignedUp, setHasSignedUp] = useState(false);

  useEffect(() => {
    setHasSignedUp(Boolean(getEmail()));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const role = getRole();
    const done = isProfileComplete();

    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const rawNext = params.get('next');
    const safeNext =
      rawNext &&
      rawNext.startsWith('/') &&
      !rawNext.startsWith('//') &&
      (rawNext.startsWith('/host') || rawNext.startsWith('/locum'))
        ? rawNext
        : null;

    if (!done) {
      router.replace(role === 'clinic' ? '/host/setup' : '/locum/setup');
      return;
    }
    if (safeNext) {
      router.replace(safeNext);
      return;
    }
    router.replace(role === 'clinic' ? '/host/dashboard' : '/locum/dashboard');
  }, [router]);

  return <HomeLandingView interactive hasSignedUp={hasSignedUp} />;
}
