'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useHostProfile } from '@/hooks/useHostProfile';
import { hostProfileCompletionPct } from '@/lib/hostProfileCompletion';
import {
  BellIcon,
  BookIcon,
  EmptyIllustration,
  FileIcon,
  MessageIcon,
  PlusIcon,
  ProfileIcon,
  ShieldIcon,
  UserEditIcon,
} from './host-dashboard-icons';

const NAV_ITEMS = [
  { id: 'postings', label: 'My Postings', href: '/host/dashboard' },
  { id: 'profile', label: 'Profile', href: '/host/profile' },
  { id: 'messages', label: 'Messages', href: '/host/messages' },
  { id: 'resources', label: 'Resources', href: '/host/resources' },
];
const TABS = [
  { id: 'active', label: 'Active Posts' },
  { id: 'ongoing', label: 'Ongoing Jobs' },
  { id: 'recent', label: 'Recent Jobs' },
];
const NAVBAR_HEIGHT = 72;
const CREDENTIAL_OPTIONS = [
  'CPSNS Full License',
  'CFPC Eligible',
  'CMPA coverage',
  'BLS (ACLS preferred)',
  'DEA License',
  'PALS Certified',
];

const fieldInp: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #D0D5DD',
  borderRadius: 8,
  fontSize: 14,
  color: '#0B0F1F',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

function DetailsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M10.5 2H4.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6L10.5 2Z"
        stroke="#3B4FD8"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 2v4H15M6.5 9h5M6.5 11.5h5M6.5 7h2"
        stroke="#3B4FD8"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ScheduleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="2"
        y="4"
        width="14"
        height="12"
        rx="2"
        stroke="#3B4FD8"
        strokeWidth="1.4"
      />
      <path
        d="M6 2v3M12 2v3M2 8h14"
        stroke="#3B4FD8"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function RequirementsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2L11 7h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5L9 2Z"
        stroke="#3B4FD8"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
function ActiveBadge() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        width: 20,
        height: 20,
        borderRadius: 4,
        background: '#1C32D2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 6l3 3 5-5"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 4l4 4-4 4"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function GrayBadge() {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        background: '#F3F4F6',
        border: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path
          d="M2 5.5l2.5 2.5 4.5-4.5"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function CollapsedStep({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: '#EEF0FB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0B0F1F' }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <Chevron />
      <GrayBadge />
    </div>
  );
}
function UpcomingStep({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0B0F1F' }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <Chevron />
    </div>
  );
}

function JobPostingOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [keyResponsibilities, setKeyResponsibilities] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('05:00');
  const [endTime, setEndTime] = useState('14:00');
  const [flexible, setFlexible] = useState(false);
  const [ratePerDay, setRatePerDay] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [credentials, setCredentials] = useState<string[]>([
    'CPSNS Full License',
  ]);
  const [travelReq, setTravelReq] = useState(false);

  function toggle(c: string) {
    setCredentials((p) =>
      p.includes(c) ? p.filter((x) => x !== c) : [...p, c],
    );
  }

  const lbl: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(28,50,130,0.45)',
          zIndex: 200,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 480,
          height: '100vh',
          background: '#fff',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '22px 24px 18px',
            borderBottom: '1px solid #F3F4F6',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0B0F1F' }}>
            Create New Post
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              color: '#6B7280',
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* ── STEP 1: Details ── */}
          {step === 1 ? (
            <div
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px 10px',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#EEF0FB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <DetailsIcon />
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: '#0B0F1F' }}
                  >
                    Details
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Define the role and culture.
                  </div>
                </div>
              </div>
              <ActiveBadge />
              <div
                style={{
                  padding: '0 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div>
                  <label style={lbl}>Job Title</label>
                  <input
                    style={fieldInp}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job Title"
                  />
                </div>
                <div>
                  <label style={lbl}>Job Description</label>
                  <textarea
                    style={
                      {
                        ...fieldInp,
                        height: 90,
                        resize: 'none',
                      } as React.CSSProperties
                    }
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Describe the role…"
                  />
                </div>
                <div>
                  <label style={lbl}>Key Responsibilities</label>
                  <textarea
                    style={
                      {
                        ...fieldInp,
                        height: 80,
                        resize: 'none',
                      } as React.CSSProperties
                    }
                    value={keyResponsibilities}
                    onChange={(e) => setKeyResponsibilities(e.target.value)}
                    placeholder="List key responsibilities…"
                  />
                </div>
              </div>
            </div>
          ) : (
            <CollapsedStep
              icon={<DetailsIcon />}
              label="Details"
              sub="Define the role and culture."
              onClick={() => setStep(1)}
            />
          )}

          {/* ── STEP 2: Schedule ── */}
          {step === 2 ? (
            <div
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px 10px',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#EEF0FB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ScheduleIcon />
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: '#0B0F1F' }}
                  >
                    Schedule
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Set dates, times, and pay
                  </div>
                </div>
              </div>
              <ActiveBadge />
              <div
                style={{
                  padding: '0 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={lbl}>Start Date</label>
                    <input
                      type="date"
                      style={fieldInp}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      //mm-dd-yyyy pattern needs to be follow 
                    />
                  </div>
                  <div>
                    <label style={lbl}>End Date</label>
                    <input
                      type="date"
                      style={fieldInp}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={lbl}>Start Time</label>
                    <input
                      type="time"
                      style={fieldInp}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lbl}>End Time</label>
                    <input
                      type="time"
                      style={fieldInp}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={flexible}
                    onChange={(e) => setFlexible(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#1C32D2' }}
                  />
                  Schedule is flexible
                </label>
                <div>
                  <label style={lbl}>Rate per Day (CAD)*</label>
                  <input
                    style={fieldInp}
                    type="number"
                    value={ratePerDay}
                    onChange={(e) => setRatePerDay(e.target.value)}
                    placeholder="e.g. 2000"
                  />
                </div>
              </div>
            </div>
          ) : step > 2 ? (
            <CollapsedStep
              icon={<ScheduleIcon />}
              label="Schedule"
              sub="Set dates, times, and pay"
              onClick={() => setStep(2)}
            />
          ) : (
            <UpcomingStep
              icon={<ScheduleIcon />}
              label="Schedule"
              sub="Set dates, times, and pay"
            />
          )}

          {/* ── STEP 3: Requirements ── */}
          {step === 3 ? (
            <div
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px 10px',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#EEF0FB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <RequirementsIcon />
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: '#0B0F1F' }}
                  >
                    Requirements
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    List mandatory licenses and experience
                  </div>
                </div>
              </div>
              <ActiveBadge />
              <div
                style={{
                  padding: '0 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div>
                  <label style={lbl}>Years of Experience</label>
                  <input
                    style={{ ...fieldInp, maxWidth: 200 }}
                    type="number"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <label style={{ ...lbl, marginBottom: 10 }}>
                    Required Credentials
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CREDENTIAL_OPTIONS.map((c) => {
                      const on = credentials.includes(c);
                      return (
                        <span
                          key={c}
                          onClick={() => toggle(c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 12px',
                            borderRadius: 20,
                            cursor: 'pointer',
                            fontSize: 13,
                            userSelect: 'none',
                            background: on ? '#EEF0FB' : '#fff',
                            border: `1px solid ${on ? '#3B4FD8' : '#D0D5DD'}`,
                            color: on ? '#1C32D2' : '#374151',
                          }}
                        >
                          {c}
                          {on && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                toggle(c);
                              }}
                              style={{
                                fontSize: 14,
                                color: '#1C32D2',
                                lineHeight: 1,
                                marginLeft: 2,
                              }}
                            >
                              ×
                            </span>
                          )}
                        </span>
                      );
                    })}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '5px 12px',
                        borderRadius: 20,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: '#6B7280',
                        border: '1px dashed #D0D5DD',
                        background: '#fff',
                      }}
                    >
                      Add more
                    </span>
                  </div>
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={travelReq}
                    onChange={(e) => setTravelReq(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#1C32D2' }}
                  />
                  Locum is required to travel to Clinic
                </label>
              </div>
            </div>
          ) : (
            <UpcomingStep
              icon={<RequirementsIcon />}
              label="Requirements"
              sub="List mandatory licenses and experience"
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: '10px 28px',
                background: '#fff',
                border: '1px solid #D0D5DD',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                color: '#0B0F1F',
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: '10px 28px',
                background: '#1C32D2',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function HostDashboard() {
  const router = useRouter();
  const { profileComplete } = useAuth() as { profileComplete?: boolean };
  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('postings');
  const [activeTab, setActiveTab] = useState('active');
  const [showJobOverlay, setShowJobOverlay] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && profileComplete === false) router.replace('/host/setup');
  }, [mounted, profileComplete, router]);

  const { profile, loading: profileLoading } = useHostProfile();
  const hostFirst = profile?.contactFirstName ?? '';
  const hostLast = profile?.contactLastName ?? '';
  const hostInitial = hostFirst ? hostFirst[0].toUpperCase() : 'H';
  const doctorLabel =
    hostFirst || hostLast ? `Dr ${hostFirst} ${hostLast}`.trim() : 'Dr Host';
  const clinicName = profile?.clinicName || 'Welcome';
  const description =
    'Define and manage organizational, hierarchy, departments, and relationships with AI-Powered insights';
  const profilePct = hostProfileCompletionPct(profile);
  const stats = [
    { label: 'Total Jobs Posted', value: 0 },
    { label: 'Active Jobs', value: 0 },
    { label: 'Completed Jobs', value: 0 },
    { label: 'Applications', value: 0 },
  ];

  if (!mounted || profileComplete === false || profileLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          background: '#fff',
          color: '#64748b',
          fontSize: 14,
        }}
      >
        Loading dashboard…
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
        background: '#fff',
      }}
    >
      {/* NAVBAR */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: NAVBAR_HEIGHT,
          zIndex: 100,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          background: '#FFFFFF',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
        }}
      >
        <Link
          href="/home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            priority
            style={{ objectFit: 'contain' }}
          />
          <span
            style={{
              fontFamily: 'Gilroy-Black, Outfit, sans-serif',
              fontWeight: 400,
              fontSize: 28,
              lineHeight: '28px',
              textTransform: 'capitalize',
            }}
          >
            <span style={{ color: '#0F2A7A' }}>Locum </span>
            <span style={{ color: '#30C6C6' }}>Link</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28 }}>
            <BellIcon />
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(58,101,219,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Hanken Grotesk, Inter, sans-serif',
                fontWeight: 700,
                fontSize: 16,
                color: '#0F2AAE',
              }}
            >
              {hostInitial}
            </span>
          </div>
        </div>
      </nav>

      {/* BODY */}
      <div
        style={{
          display: 'flex',
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          marginTop: NAVBAR_HEIGHT,
          overflow: 'hidden',
        }}
      >
        {/* SIDEBAR */}
        <aside
          style={{
            position: 'relative',
            flexShrink: 0,
            width: 232,
            height: '100%',
            overflowY: 'auto',
            boxSizing: 'border-box',
            background: '#F4F6FB',
            boxShadow: 'inset 0px 4px 22px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 10px 28px',
            gap: 14,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top:
                8 +
                27 +
                12 +
                NAV_ITEMS.findIndex((n) => n.id === activeNav) * 38 +
                5,
              width: 6,
              height: 33,
              background: 'linear-gradient(270deg, #3A65DB 0%, #1B31D2 100%)',
              borderRadius: '0px 8px 8px 0px',
              transition: 'top 0.2s ease',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              width: '100%',
            }}
          >
            <div style={{ paddingLeft: 10 }}>
              <span
                style={{
                  fontFamily: 'Hanken Grotesk, Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: '27px',
                  color: '#6B7280',
                  textTransform: 'capitalize',
                }}
              >
                Locum Management
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {NAV_ITEMS.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      router.push(item.href);
                    }}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      maxWidth: 212,
                      height: isActive ? 44 : 20,
                      padding: isActive
                        ? '12px 12px 12px 8px'
                        : '0px 12px 0px 8px',
                      background: isActive
                        ? 'rgba(130,173,237,0.2)'
                        : 'transparent',
                      borderRadius: isActive ? 4 : 16,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.id === 'postings' && <FileIcon active={isActive} />}
                      {item.id === 'profile' && (
                        <ProfileIcon active={isActive} />
                      )}
                      {item.id === 'messages' && (
                        <MessageIcon active={isActive} />
                      )}
                      {item.id === 'resources' && (
                        <BookIcon active={isActive} />
                      )}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Gilroy-Medium, Inter, sans-serif',
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: '100%',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                        ...(isActive
                          ? {
                              background:
                                'linear-gradient(270deg,#3A65DB 0%,#1B31D2 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }
                          : { color: 'rgba(2,7,27,0.9)' }),
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ width: '100%', height: 1, background: '#DBE1E8' }} />
        </aside>

        {/* MAIN */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#F7F8FA',
            padding: '19px 24px 48px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    width: 'fit-content',
                    padding: '8px 12px',
                    background: 'rgba(171,230,234,0.1)',
                    borderRadius: 50,
                  }}
                >
                  <ShieldIcon />
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: 18,
                      lineHeight: '120%',
                      color: '#309BB7',
                      textTransform: 'capitalize',
                    }}
                  >
                    {doctorLabel}
                  </span>
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 30,
                    lineHeight: '120%',
                    color: '#0B0F1F',
                    textTransform: 'capitalize',
                  }}
                >
                  {clinicName}
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 16,
                    lineHeight: '150%',
                    color: '#6B7280',
                    textTransform: 'capitalize',
                  }}
                >
                  {description}
                </p>
              </div>
              {/* Stats */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid rgba(217,217,217,0.8)',
                  borderRadius: 10,
                  padding: 24,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  {stats.map((stat, i) => (
                    <div
                      key={stat.label}
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 24,
                          flex: 1,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            fontSize: 18,
                            lineHeight: '140%',
                            color: '#4A4A4A',
                          }}
                        >
                          {stat.label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            fontSize: 32,
                            lineHeight: '26px',
                            color: '#000',
                          }}
                        >
                          {stat.value}
                        </span>
                      </div>
                      {i < stats.length - 1 && (
                        <div
                          style={{
                            width: 1,
                            alignSelf: 'stretch',
                            background: '#D9D9D9',
                            marginLeft: 12,
                            marginRight: 12,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile banner */}
            <div
              style={{
                background: 'rgba(209,213,219,0.3)',
                borderRadius: 10,
                height: 104,
                padding: '0 27px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(15,42,175,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M8 4h12l4 4v16H4V4h4Z"
                      stroke="#803BDB"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 12h10M9 16h6"
                      stroke="#803BDB"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="5"
                      fill="#72BC7A"
                      stroke="#72BC7A"
                      strokeWidth="1"
                    />
                    <path
                      d="M17.5 20l2 2 3-3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <span
                    style={{
                      fontFamily: 'Gilroy-Medium, Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: 22,
                      lineHeight: '100%',
                      color: '#151414',
                    }}
                  >
                    Set up your profile to start posting
                  </span>
                  <span
                    style={{
                      fontFamily: 'Gilroy-Medium, Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: 18,
                      lineHeight: '100%',
                      color: '#606061',
                    }}
                  >
                    {profilePct}% Completed
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push('/host/profile')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  width: 150,
                  height: 41,
                  background: '#fff',
                  border: '1px solid #D0D5DD',
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                <UserEditIcon />
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 18,
                    lineHeight: '140%',
                    color: '#0B0F1F',
                  }}
                >
                  Edit Profile
                </span>
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 52,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 12,
                          height: 52,
                          borderBottom: isActive
                            ? '2px solid #000'
                            : '2px solid transparent',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            fontSize: 16,
                            lineHeight: '24px',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                            color: isActive ? '#000' : '#636364',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowJobOverlay(true)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    height: 45,
                    width: 172,
                    background:
                      'linear-gradient(270deg,#3A65DB 0%,#1B31D2 100%)',
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                >
                  <PlusIcon />
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 18,
                      lineHeight: '140%',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Post New Job
                  </span>
                </button>
              </div>
              <div style={{ width: 428, height: 1, background: '#A7A8AA' }} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 80,
                  gap: 12,
                }}
              >
                <EmptyIllustration />
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 18,
                    color: '#0B0F1F',
                    marginTop: 8,
                  }}
                >
                  No posts yet
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 14,
                    color: '#6B7280',
                  }}
                >
                  You have not posted any jobs yet
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* JOB POSTING OVERLAY */}
      {showJobOverlay && (
        <JobPostingOverlay onClose={() => setShowJobOverlay(false)} />
      )}
    </div>
  );
}
