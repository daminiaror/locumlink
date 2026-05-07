'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetchJson } from '@/lib/adminApi';

type LogRow = {
    id: string;
    actor: string;
    action: string;
    entity: string;
    createdAt: string;
    detail: string;
};

export default function AdminAuditLogsPage() {
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [rows, setRows] = useState<LogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 350);
        return () => clearTimeout(t);
    }, [q]);

    const load = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const qs = new URLSearchParams({ take: '200' });
            if (debouncedQ.trim()) qs.set('q', debouncedQ.trim());
            const data = await adminFetchJson<{ items: LogRow[] }>(
                `/api/admin/audit-logs?${qs.toString()}`,
            );
            const items = data.items ?? [];
            const t = debouncedQ.trim().toLowerCase();
            const filtered =
                t === ''
                    ? items
                    : items.filter((r) => {
                          const hay = `${r.actor} ${r.action} ${r.entity} ${r.detail}`.toLowerCase();
                          return hay.includes(t);
                        });
            setRows(filtered);
        }
 catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to load');
            setRows([]);
        }
 finally {
            setLoading(false);
        }
    }, [debouncedQ]);

    useEffect(() => {
        load();
    }, [load]);

    function fmt(ts: string) {
        try {
            const d = new Date(ts);
            return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })}`;
        }
 catch {
            return ts;
        }
    }

    return (
        <AdminLayout
            title="Audit Logs"
            subtitle="Rows from audit_logs (user actions & admin actions)."
            right={
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search logs…"
                    style={{
                        width: 320,
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 10,
                        border: '1px solid #E5E7EB',
                        background: '#fff',
                        fontSize: 13,
                        outline: 'none',
                        fontFamily: 'inherit',
                    }}
                />
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
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 0.65fr 0.75fr 0.85fr minmax(0, 2fr)',
                        gap: 10,
                        padding: '12px 14px',
                        borderBottom: '1px solid #F3F4F6',
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        color: '#9CA3AF',
                        textTransform: 'uppercase',
                    }}
                >
                    <div>Actor</div>
                    <div>Action</div>
                    <div>Entity</div>
                    <div>Timestamp</div>
                    <div>Detail</div>
                </div>

                {loading ? (
                    <div style={{ padding: 20, fontSize: 13, color: '#6B7280' }}>Loading…</div>
                ) : rows.length === 0 ? (
                    <div style={{ padding: 20, fontSize: 13, color: '#6B7280' }}>No audit rows.</div>
                ) : (
                    rows.map((r) => (
                        <div
                            key={r.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 0.65fr 0.75fr 0.85fr minmax(0, 2fr)',
                                gap: 10,
                                padding: '12px 14px',
                                borderBottom: '1px solid #F9FAFB',
                                alignItems: 'center',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 900,
                                    color: '#0f1523',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {r.actor}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#1B31D2' }}>
                                {r.action}
                            </div>
                            <div style={{ fontSize: 13, color: '#374151' }}>{r.entity}</div>
                            <div style={{ fontSize: 13, color: '#374151' }}>{fmt(r.createdAt)}</div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: '#6B7280',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                                title={r.detail}
                            >
                                {r.detail || '—'}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AdminLayout>
    );
}
