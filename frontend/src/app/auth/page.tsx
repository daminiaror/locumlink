import { Suspense } from 'react';
import AuthPage from './auth-page';

export default function Page() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
