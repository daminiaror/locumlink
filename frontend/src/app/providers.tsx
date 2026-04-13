'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';

/** Client boundary for the root layout — keeps `layout.tsx` a thin server shell. */
export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
