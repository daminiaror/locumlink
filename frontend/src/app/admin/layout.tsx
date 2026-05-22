'use client';

import { Suspense, type ReactNode } from 'react';
import AdminAuthGate from '@/components/AdminAuthGate';
import { AdminStatsProvider } from '@/components/AdminStatsContext';

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '40vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      }
    >
      <AdminAuthGate>
        <AdminStatsProvider>{children}</AdminStatsProvider>
      </AdminAuthGate>
    </Suspense>
  );
}
