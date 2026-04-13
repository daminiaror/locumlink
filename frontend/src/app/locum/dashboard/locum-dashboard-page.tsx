'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashLayout, { NavIcon } from '@/components/DashLayout';
import { locumApi } from '@/lib/api';
import type { LocumProfile } from '@/types';

const NAV = [
  { label: 'Browse Opportunities', href: '/locum/browse',    icon: <NavIcon name="browse"    /> },
  { label: 'My Applications',      href: '/locum/dashboard', icon: <NavIcon name="postings"  /> },
  { label: 'Profile',              href: '/locum/profile',   icon: <NavIcon name="profile"   /> },
  { label: 'Messages',             href: '/locum/messages',  icon: <NavIcon name="messages"  /> },
  { label: 'Resources',            href: '/locum/resources', icon: <NavIcon name="resources" /> },
];

interface Application {
  id: number; title: string; clinic: string;
  city: string; province: string;
  start: string; end: string;
  startT: string; endT: string; daysAgo: number;
}

const MOCK_APPS: Application[] = [
  {
    id: 1,
    title: 'Family Physician Locum – Rural Primary Care Clinic',
    clinic: 'Family Physician Clinic', city: 'Halifax', province: 'Nova Scotia',
    start: 'Feb 26, 2026', end: 'Mar 30, 2026',
    startT: '05:00 AM', endT: '02:00 PM', daysAgo: 8,
  },
];

export default function LocumDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'recent' | 'upcoming' | 'completed'>('recent');
  const [profile, setProfile] = useState<LocumProfile | null>(null);

  // ── Fetch real profile so we can show the correct name ──────────────────
  useEffect(() => {
    locumApi.getProfile()
      .then((data) => {
        const typed = data as unknown as {
          exists: boolean;
          profile: LocumProfile | null;
        };
        if (typed.exists && typed.profile) setProfile(typed.profile);
      })
      .catch(() => { /* not logged in or no profile yet — ignore */ });
  }, []);

  const displayName = profile
    ? `Dr ${profile.firstName} ${profile.lastName}`.trim()
    : 'Welcome';

  const apps = tab === 'recent' ? MOCK_APPS : [];

  return (
    <DashLayout navItems={NAV} activeHref="/locum/dashboard">
      {/* ── Header ── */}
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1523', marginBottom: 3 }}>
        Welcome {displayName}
      </h1>
      <p style={{ fontSize: 12, color: '#8892a4', marginBottom: 18 }}>
        Define and manage organizational, hierarchy, departments, and relationships with AI-powered insights
      </p>

      {/* ── Stats ── */}
      <div style={{
        display: 'flex', border: '1px solid #e2e5ee', borderRadius: 8,
        overflow: 'hidden', marginBottom: 16, background: '#fff',
      }}>
        <div style={{ flex: 1, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#5a6478', marginBottom: 4 }}>Completed Jobs</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f1523', lineHeight: 1 }}>0</div>
        </div>
      </div>

      {/* ── Profile nudge ── */}
      <div style={{
        background: '#F4F6FB', border: '1.5px solid #3B4FD8',
        borderRadius: 10, padding: '0 20px', height: 80,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 18,
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Circular progress ring */}
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              {/* Track */}
              <circle cx="26" cy="26" r="22" fill="none" stroke="#E5E7EB" strokeWidth="4" />
              {/* Progress — 60% = 0.6 × 2π × 22 ≈ 82.9 */}
              <circle
                cx="26" cy="26" r="22" fill="none"
                stroke="#22C55E" strokeWidth="4"
                strokeDasharray="82.9 138.2"
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
              />
            </svg>
            {/* Icon in centre */}
            <img
              src="/profile-pending.png"
              alt=""
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 28, height: 28, objectFit: 'contain',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1523' }}>
              Set up your profile to start finding opportunities
            </div>
            <div style={{ fontSize: 12, color: '#5a6478' }}>60% Completed</div>
          </div>
        </div>
        <button
          onClick={() => router.push('/locum/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: '#fff',
            border: '1px solid #D0D5DD', borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#0f1523',
            flexShrink: 0,
          }}
        >
          ✏️ Edit Profile
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e5ee', marginBottom: 16 }}>
        {(['recent', 'upcoming', 'completed'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 14px', border: 'none', background: 'transparent',
            fontSize: 12, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#0f1523' : '#8892a4',
            borderBottom: tab === t ? '2px solid #0f1523' : '2px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase',
          }}>
            {t === 'recent' ? 'Recent Applications' : t === 'upcoming' ? 'Upcoming Jobs' : 'Completed Jobs'}
          </button>
        ))}
      </div>

      {/* ── Applications ── */}
      {apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#5a6478', marginBottom: 4 }}>No applications yet</div>
          <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 20 }}>
            You have not applied to any jobs yet
          </div>
          <button
            onClick={() => router.push('/locum/browse')}
            style={{
              padding: '10px 22px', background: '#3B4FD8', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Browse Opportunities
          </button>
        </div>
      ) : (
        apps.map((app) => (
          <div key={app.id} style={{
            background: '#fff', border: '1px solid #e2e5ee',
            borderRadius: 8, padding: '16px 18px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1523', marginBottom: 4 }}>
              {app.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>🏥</span>
              <span style={{ fontSize: 13, color: '#5a6478' }}>
                {app.clinic}, {app.city}, {app.province}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#F1F3F7', padding: '4px 10px', borderRadius: 5, fontSize: 12, color: '#5a6478',
              }}>📅 {app.start} – {app.end}</span>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#F1F3F7', padding: '4px 10px', borderRadius: 5, fontSize: 12, color: '#5a6478',
              }}>🕐 {app.startT} – {app.endT}</span>
              <span style={{ fontSize: 12, color: '#8892a4', marginLeft: 'auto' }}>
                {app.daysAgo} Days ago
              </span>
            </div>
          </div>
        ))
      )}
    </DashLayout>
  );
}