'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="error-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter, sans-serif',
        background: '#fff',
        color: '#0f1523',
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: 10, fontSize: 14, color: '#6b7280' }}>
          Please try again later
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(270deg,#3A65DB 0%,#0F2A7A 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #d0d4e4',
              background: '#fff',
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
