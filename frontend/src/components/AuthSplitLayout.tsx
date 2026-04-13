'use client';

import { ReactNode } from 'react';

export type AuthSplitVariant = 'signup' | 'verify';

interface Props {
  children: ReactNode;
  /** Signup uses a taller card; verify uses a tighter card. */
  variant?: AuthSplitVariant;
}

export default function AuthSplitLayout({
  children,
  variant = 'signup',
}: Props) {
  const cardClass =
    variant === 'verify'
      ? 'auth-bg__card auth-bg__card--verify'
      : 'auth-bg__card auth-bg__card--signup';

  return (
    <div className="auth-bg">
      <div className={cardClass}>{children}</div>
    </div>
  );
}
