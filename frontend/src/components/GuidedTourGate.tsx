'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
const GuidedTour = dynamic(() => import('./GuidedTour'), {
    ssr: false,
    loading: () => null,
});
export default function GuidedTourGate() {
    return (<Suspense fallback={null}>
      <GuidedTour />
    </Suspense>);
}
