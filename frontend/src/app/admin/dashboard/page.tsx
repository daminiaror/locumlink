'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetchJson } from '@/lib/adminApi';

type AdminStats = {
  totalUsers: number;
  hostUsers?: number;
  locumUsers?: number;
  pendingVerifications: number;
  activeJobPostings?: number;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await adminFetchJson<{ stats: AdminStats }>('/api/admin/stats');
        if (!cancelled) {
          setErr(null);
          setStats(json?.stats ?? null);
        }
      }
 catch {
        if (!cancelled) {
          setStats(null);
          setErr('Could not load admin stats. Ensure backend is running and you are logged in as admin.');
        }
      }
 finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Admin cookie session + Postgres-backed counts."
      right={
        <a
          href="/admin"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            background: '#fff',
            fontSize: 13,
            fontWeight: 700,
            color: '#0f1523',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Go to Overview
        </a>
      }
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f1523', marginBottom: 8 }}>API status</div>
        {loading ? (
          <div style={{ fontSize: 13, color: '#6B7280' }}>Loading…</div>
        ) : err ? (
          <div style={{ fontSize: 13, color: '#991B1B', fontWeight: 700 }}>{err}</div>
        ) : stats ? (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: '#0f1523', fontWeight: 700 }}>
              Total users: <span style={{ color: '#1B31D2' }}>{stats.totalUsers}</span>
              {stats.locumUsers !== undefined && stats.hostUsers !== undefined ? (
                <span style={{ color: '#6B7280', fontWeight: 600 }}>
                  {' '}
                  ({stats.locumUsers} locum / {stats.hostUsers} host)
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: 13, color: '#0f1523', fontWeight: 700 }}>
              Pending verifications: <span style={{ color: '#1B31D2' }}>{stats.pendingVerifications}</span>
            </div>
            {stats.activeJobPostings !== undefined ? (
              <div style={{ fontSize: 13, color: '#0f1523', fontWeight: 700 }}>
                Active jobs: <span style={{ color: '#1B31D2' }}>{stats.activeJobPostings}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#991B1B', fontWeight: 700 }}>Unexpected empty response.</div>
        )}
      </div>
    </AdminLayout>
  );
}
