'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetchJson } from '@/lib/adminApi';

type Stats = {
  totalUsers: number;
  hostUsers: number;
  locumUsers: number;
  pendingVerifications: number;
  activeJobPostings: number;
};

type Activity = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  createdAt: string;
  detail: string;
};

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'blue' | 'green' | 'gray';
}) {
  const tones: Record<typeof tone, { bg: string; border: string; value: string }> = {
    blue: { bg: 'rgba(59,79,216,0.08)', border: 'rgba(59,79,216,0.18)', value: '#1B31D2' },
    green: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.22)', value: '#166534' },
    gray: { bg: '#F9FAFB', border: '#E5E7EB', value: '#0f1523' },
  };
  const t = tones[tone];
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#6B7280',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f1523', lineHeight: 1 }}>{value}</div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: t.bg,
            border: `1px solid ${t.border}`,
            color: t.value,
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          Live
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>{hint}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f1523' }}>{title}</div>
        {right ? <div>{right}</div> : null}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [s, logs] = await Promise.all([
        adminFetchJson<{ stats: Stats }>('/api/admin/stats'),
        adminFetchJson<{ items: Activity[] }>('/api/admin/audit-logs?take=12'),
      ]);
      setStats(s.stats ?? null);
      setActivity(logs.items ?? []);
    }
 catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load overview');
      setStats(null);
      setActivity([]);
    }
 finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cards =
    stats === null && !loading
      ? []
      : [
          {
            label: 'Pending verifications',
            value: loading ? '—' : String(stats?.pendingVerifications ?? '—'),
            hint: 'Locum profiles awaiting CPSNS review.',
            tone: 'blue' as const,
          },
          {
            label: 'Registered users',
            value: loading ? '—' : String(stats?.totalUsers ?? '—'),
            hint: `${stats?.locumUsers ?? '—'} locums · ${stats?.hostUsers ?? '—'} hosts`,
            tone: 'gray' as const,
          },
          {
            label: 'Active job postings',
            value: loading ? '—' : String(stats?.activeJobPostings ?? '—'),
            hint: 'Jobs currently visible to locums.',
            tone: 'green' as const,
          },
        ];

  return (
    <AdminLayout
      title="Overview"
      subtitle={loading ? 'Loading…' : 'Live counts from Postgres via the Nest admin API.'}
      right={
        <button
          type="button"
          onClick={() => refresh()}
          disabled={loading}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            background: '#fff',
            fontSize: 13,
            fontWeight: 700,
            color: '#0f1523',
            cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Refresh
        </button>
      }
    >
      {err ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.22)',
            color: '#991B1B',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {err}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 14,
          marginBottom: 14,
        }}
      >
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 14,
        }}
      >
        <Panel title="Recent admin activity">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              <div style={{ fontSize: 13, color: '#6B7280' }}>Loading…</div>
            ) : activity.length === 0 ? (
              <div style={{ fontSize: 13, color: '#6B7280' }}>No audit entries yet.</div>
            ) : (
              activity.map((e) => {
                const d = new Date(e.createdAt);
                const meta = `${e.actor} · ${d.toLocaleString()}`;
                return (
                  <div
                    key={e.id}
                    style={{
                      padding: '12px 12px',
                      border: '1px solid #F3F4F6',
                      borderRadius: 10,
                      background: '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f1523' }}>
                        {e.action} · {e.entity}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {meta}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>
                      {e.detail || '—'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        <Panel title="Admin checklist" right={<span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700 }}>This week</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { t: 'Review pending CPSNS verifications', d: 'Keep queue under 24h.' },
              { t: 'Check rejected verifications', d: 'Ensure reasons are actionable.' },
              { t: 'Spot-check job postings', d: 'Remove spam or unsafe content.' },
            ].map((x) => (
              <div key={x.t} style={{ padding: '12px 12px', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f1523', marginBottom: 4 }}>{x.t}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{x.d}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
