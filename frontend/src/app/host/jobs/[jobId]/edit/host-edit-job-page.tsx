'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashLayout, { NavIcon } from '@/components/DashLayout';
import { hostApi } from '@/lib/api';
import { useHostProfile } from '@/hooks/useHostProfile';
import { isCpsnsVerified } from '@/lib/cpsnsVerify';

const NAV = [
  {
    label: 'My Postings',
    href: '/host/dashboard',
    icon: <NavIcon name="postings" />,
  },
  { label: 'Profile', href: '/host/profile', icon: <NavIcon name="profile" /> },
  {
    label: 'Messages',
    href: '/host/messages',
    icon: <NavIcon name="messages" />,
  },
  {
    label: 'Resources',
    href: '/host/resources',
    icon: <NavIcon name="resources" />,
  },
];

const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d0d4e4',
  borderRadius: 8,
  fontSize: 14,
  color: '#0f1523',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

export default function HostEditJobPage() {
  const params = useParams();
  const jobId = typeof params?.jobId === 'string' ? params.jobId : '';
  const router = useRouter();
  const { profile, loading: profileLoading } = useHostProfile();
  const verified = isCpsnsVerified(profile?.cpsnsNumber);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [servicesRaw, setServicesRaw] = useState('');
  const [isRural, setIsRural] = useState(false);
  const [accommodationProvided, setAccommodationProvided] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [loadBusy, setLoadBusy] = useState(true);
  const [jobLoaded, setJobLoaded] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setErr('Invalid job link.');
      setLoadBusy(false);
      setJobLoaded(false);
      return;
    }
    let cancelled = false;
    setLoadBusy(true);
    setJobLoaded(false);
    setErr('');
    hostApi
      .getJob(jobId)
      .then(({ job }) => {
        if (cancelled) return;
        setTitle(job.title ?? '');
        setDescription(
          typeof job.description === 'string' ? job.description : '',
        );
        setLocation(typeof job.location === 'string' ? job.location : '');
        setExpiresAt(
          toDatetimeLocalValue(job.expiresAt as string | undefined),
        );
        const sr = (job as { servicesRequired?: unknown }).servicesRequired;
        setServicesRaw(
          Array.isArray(sr)
            ? sr.join(', ')
            : typeof sr === 'string'
              ? sr
              : '',
        );
        setIsRural(Boolean(job.isRural));
        setAccommodationProvided(Boolean(job.accommodationProvided));
        setJobLoaded(true);
        setLoadBusy(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : 'Could not load this job.';
        setErr(msg);
        setJobLoaded(false);
        setLoadBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');

    const t = title.trim();
    if (!t) {
      setErr('Please enter a job title.');
      return;
    }

    const servicesRequired = servicesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setBusy(true);
    try {
      await hostApi.updateJob(jobId, {
        title: t,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        servicesRequired: servicesRequired.length ? servicesRequired : [],
        isRural,
        accommodationProvided,
      });
      router.push('/host/dashboard');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not save changes. Please try again.';
      setErr(msg);
      setBusy(false);
    }
  }

  if (!jobId) {
    return (
      <DashLayout
        navItems={NAV}
        activeHref="/host/dashboard"
        topbarFirstName={profile?.contactFirstName}
        topbarLastName={profile?.contactLastName}
      >
        <p style={{ color: '#dc2626' }}>Invalid job link.</p>
      </DashLayout>
    );
  }

  return (
    <DashLayout
      navItems={NAV}
      activeHref="/host/dashboard"
      topbarFirstName={profile?.contactFirstName}
      topbarLastName={profile?.contactLastName}
    >
      <div style={{ maxWidth: 560 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#0f1523',
            marginBottom: 8,
          }}
        >
          Edit job
        </h1>

        {!profileLoading && !verified && (
          <div
            style={{
              background: '#fff7ed',
              border: '1px solid #fdba74',
              color: '#9a3412',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            <strong>Your CPSNS number is pending verification.</strong> Edits are
            saved; listings stay as drafts until verified.
          </div>
        )}

        {loadBusy && (
          <p style={{ fontSize: 14, color: '#6b7280' }}>Loading job…</p>
        )}

        {!loadBusy && !jobLoaded && err && (
          <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 16 }}>
            {err}
          </p>
        )}

        {!loadBusy && jobLoaded && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Job title *</label>
              <input
                style={inp}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Family physician locum — 2 weeks"
                maxLength={200}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Description</label>
              <textarea
                style={{ ...inp, minHeight: 120, resize: 'vertical' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shift expectations, clinic context, etc."
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Location</label>
              <input
                style={inp}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, province"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Listing expiry</label>
              <input
                type="datetime-local"
                style={inp}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Services required</label>
              <input
                style={inp}
                value={servicesRaw}
                onChange={(e) => setServicesRaw(e.target.value)}
                placeholder="Comma-separated, e.g. ER, Family practice"
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={isRural}
                  onChange={(e) => setIsRural(e.target.checked)}
                />
                Rural placement
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={accommodationProvided}
                  onChange={(e) => setAccommodationProvided(e.target.checked)}
                />
                Accommodation provided
              </label>
            </div>

            {err && (
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
                {err}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: busy
                    ? '#9ca3af'
                    : 'linear-gradient(270deg,#3A65DB 0%,#1B31D2 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: busy ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/host/dashboard')}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: '1px solid #d0d4e4',
                  background: '#fff',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </DashLayout>
  );
}
