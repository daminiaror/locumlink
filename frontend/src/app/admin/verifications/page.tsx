'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetchJson } from '@/lib/adminApi';

type VerificationRow = {
    id: string;
    userId: string;
    email: string;
    name: string;
    cpsns: string;
    submittedAt: string;
    verificationStatus:
        | 'UNVERIFIED'
        | 'PENDING_REVIEW'
        | 'VERIFIED'
        | 'REJECTED';
};

function StatusTag({ status }: { status: VerificationRow['verificationStatus'] }) {
    const map = {
        UNVERIFIED: {
            label: 'Unverified',
            bg: 'rgba(107,114,128,0.12)',
            border: 'rgba(107,114,128,0.35)',
            color: '#374151',
        },
        PENDING_REVIEW: {
            label: 'Pending',
            bg: 'rgba(59,79,216,0.10)',
            border: 'rgba(59,79,216,0.22)',
            color: '#1B31D2',
        },
        VERIFIED: {
            label: 'Verified',
            bg: 'rgba(34,197,94,0.10)',
            border: 'rgba(34,197,94,0.22)',
            color: '#166534',
        },
        REJECTED: {
            label: 'Rejected',
            bg: 'rgba(220,38,38,0.10)',
            border: 'rgba(220,38,38,0.18)',
            color: '#991B1B',
        },
    };
    const s = map[status];
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
                border: `1px solid ${s.border}`,
                background: s.bg,
                color: s.color,
                whiteSpace: 'nowrap',
                lineHeight: 1,
            }}
        >
            {s.label}
        </span>
    );
}

export default function AdminVerificationsPage() {
    const [tab, setTab] = useState<'pending' | 'VERIFIED' | 'REJECTED'>('pending');
    const [rows, setRows] = useState<VerificationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const statusQuery = useMemo(() => {
        if (tab === 'pending') return '';
        return tab;
    }, [tab]);

    const load = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const qs = new URLSearchParams();
            if (statusQuery) qs.set('status', statusQuery);
            const path = qs.toString()
                ? `/api/admin/verifications?${qs.toString()}`
                : `/api/admin/verifications`;
            const data = await adminFetchJson<{ items: VerificationRow[] }>(path);
            setRows(data.items ?? []);
        }
 catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to load');
            setRows([]);
        }
 finally {
            setLoading(false);
        }
    }, [statusQuery, tab]);

    useEffect(() => {
        load();
    }, [load]);

    async function patchStatus(id: string, verificationStatus: 'VERIFIED' | 'REJECTED') {
        setBusyId(id);
        setErr(null);
        try {
            await adminFetchJson(`/api/admin/verifications/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ verificationStatus }),
            });
            await load();
        }
 catch (e) {
            setErr(e instanceof Error ? e.message : 'Update failed');
        }
 finally {
            setBusyId(null);
        }
    }

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
            title="Verifications"
            subtitle="Locum profiles from locum_profiles; approve or reject CPSNS verification."
            right={
                <div style={{ display: 'flex', gap: 10 }}>
                    {(['pending', 'VERIFIED', 'REJECTED'] as const).map((k) => {
                        const active = tab === k;
                        const label = k === 'pending' ? 'Pending' : k === 'VERIFIED' ? 'Verified' : 'Rejected';
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setTab(k)}
                                style={{
                                    height: 40,
                                    padding: '0 12px',
                                    borderRadius: 999,
                                    border: `1px solid ${active ? 'rgba(59,79,216,0.30)' : '#E5E7EB'}`,
                                    background: active ? 'rgba(59,79,216,0.10)' : '#fff',
                                    color: active ? '#1B31D2' : '#374151',
                                    fontSize: 13,
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
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
                        gridTemplateColumns: tab === 'pending' ? '1.15fr 1fr 0.65fr 1fr 0.55fr 1.1fr' : '1.15fr 1fr 0.65fr 1fr 0.65fr',
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
                    <div>Locum</div>
                    <div>Email</div>
                    <div>CPSNS</div>
                    <div>Updated</div>
                    <div>Status</div>
                    {tab === 'pending' ? <div>Actions</div> : null}
                </div>

                {loading ? (
                    <div style={{ padding: 20, fontSize: 13, color: '#6B7280' }}>Loading…</div>
                ) : (
                    rows.map((r) => (
                        <div
                            key={r.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    tab === 'pending'
                                        ? '1.15fr 1fr 0.65fr 1fr 0.55fr 1.1fr'
                                        : '1.15fr 1fr 0.65fr 1fr 0.65fr',
                                gap: 10,
                                padding: '12px 14px',
                                borderBottom: '1px solid #F9FAFB',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 900,
                                        color: '#0f1523',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {r.name}
                                </div>
                                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.id}</div>
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: '#374151',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {r.email}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f1523' }}>{r.cpsns}</div>
                            <div style={{ fontSize: 13, color: '#374151' }}>{fmt(r.submittedAt)}</div>
                            <div>
                                <StatusTag status={r.verificationStatus} />
                            </div>
                            {tab === 'pending' ? (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        disabled={
                                            busyId === r.id
                                            || (
                                                r.verificationStatus !== 'PENDING_REVIEW'
                                                && r.verificationStatus !== 'UNVERIFIED'
                                            )
                                        }
                                        onClick={() => patchStatus(r.id, 'VERIFIED')}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(34,197,94,0.35)',
                                            background: 'rgba(34,197,94,0.10)',
                                            color: '#166534',
                                            fontSize: 12,
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            busyId === r.id
                                            || (
                                                r.verificationStatus !== 'PENDING_REVIEW'
                                                && r.verificationStatus !== 'UNVERIFIED'
                                            )
                                        }
                                        onClick={() => patchStatus(r.id, 'REJECTED')}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(220,38,38,0.28)',
                                            background: 'rgba(220,38,38,0.08)',
                                            color: '#991B1B',
                                            fontSize: 12,
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </div>
        </AdminLayout>
    );
}
