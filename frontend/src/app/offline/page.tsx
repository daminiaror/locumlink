'use client';
export default function OfflinePage() {
  return (
    <div className="offline-page-root" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: '16px',
      textAlign: 'center', padding: '24px'
    }}>
      <img src="/logo.png" alt="Locum Link" width={80} />
      <h1 style={{ fontSize: '20px', fontWeight: 500 }}>No internet connection</h1>
      <p style={{ color: '#6b7280', maxWidth: '280px' }}>
        Please check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 24px', borderRadius: '8px',
          background: '#1a56db', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: '14px'
        }}>
        Try again
      </button>
    </div>
  );
}
