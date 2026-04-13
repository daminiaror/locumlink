'use client';

import { useState, useEffect, useRef } from 'react';
import DashLayout, { NavIcon } from '@/components/DashLayout';
import { useHostProfile } from '@/hooks/useHostProfile';
import type { HostProfile } from '@/types';
import { hostProfileCompletionPct } from '@/lib/hostProfileCompletion';

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

// ── shared styles ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #d0d4e4',
  borderRadius: 6,
  fontSize: 13,
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
  marginBottom: 5,
};

const AMENITY_OPTIONS = [
  'On-site Parking',
  'Digital X-Ray',
  'Laboratory services',
  'Pharmacy nearby',
  'Cafeteria',
  'Private Office Space',
  'Admin Support',
  'IT Support',
];

// ── step status helpers ───────────────────────────────────────────────────────
type StepStatus = 'upcoming' | 'active' | 'complete' | 'incomplete';
function stepBorderColor(s: StepStatus) {
  if (s === 'active') return '#3B4FD8';
  if (s === 'complete') return '#16a34a';
  if (s === 'incomplete') return '#f97316';
  return '#e2e5ee';
}
function stepCircleBg(s: StepStatus) {
  if (s === 'active') return '#3B4FD8';
  if (s === 'complete') return '#16a34a';
  if (s === 'incomplete') return '#f97316';
  return '#e2e5ee';
}
function stepLabelColor(s: StepStatus) {
  if (s === 'active') return '#3B4FD8';
  if (s === 'complete') return '#16a34a';
  if (s === 'incomplete') return '#f97316';
  return '#8892a4';
}

function sectionCard(highlighted: boolean): React.CSSProperties {
  return {
    background: '#fff',
    border: `1px solid ${highlighted ? '#3B4FD8' : '#e2e5ee'}`,
    borderRadius: 8,
    padding: '20px',
    marginBottom: 16,
  };
}

export default function HostProfilePage() {
  // ── API hook ──────────────────────────────────────────────────────────────
  const { profile, loading, saveProfile, saving } = useHostProfile();

  // ── Local form state ──────────────────────────────────────────────────────
  // Step 1 — Basic Info
  const [clinicName, setClinicName] = useState('');
  const [contactFirst, setContactFirst] = useState('');
  const [contactLast, setContactLast] = useState('');
  const [hostFirst, setHostFirst] = useState('');
  const [hostLast, setHostLast] = useState('');
  const [cpsns, setCpsns] = useState('');
  const [licenseFile, setLicenseFile] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 — Location
  const [addr1, setAddr1] = useState('');
  const [addr2, setAddr2] = useState('');
  const [postal, setPostal] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');

  // Step 3 — Practice Details (profile-page-only fields)
  const [practiceType, setPracticeType] = useState('');
  const [numPhysicians, setNumPhysicians] = useState('');
  const [emr, setEmr] = useState('');
  const [patientVol, setPatientVol] = useState('');
  const [clinicDesc, setClinicDesc] = useState('');

  // Step 4 — Services
  const [amenities, setAmenities] = useState<string[]>([]);
  const [accommodation, setAccommodation] = useState(false);

  // UI
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [visited, setVisited] = useState<Set<number>>(new Set([1]));

  // ── Pre-fill form when API data arrives ──────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    setClinicName(profile.clinicName ?? '');
    setContactFirst(profile.contactFirstName ?? '');
    setContactLast(profile.contactLastName ?? '');
    // Setup stores host doctor under contactFirstName/LastName
    setHostFirst(profile.contactFirstName ?? '');
    setHostLast(profile.contactLastName ?? '');
    setCpsns(profile.cpsnsNumber ?? '');
    setLicenseFile(profile.licenseFile ?? null);
    setSpecialties(
      profile.speciality
        ? profile.speciality
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    );
    setAddr1(profile.address1 ?? '');
    setAddr2(profile.address2 ?? '');
    setPostal(profile.postalCode ?? '');
    setCity(profile.city ?? '');
    setProvince(profile.province ?? '');
    setPracticeType(profile.practiceType ?? '');
    setNumPhysicians(profile.numPhysicians ?? '');
    setEmr(profile.emr ?? '');
    setPatientVol(profile.patientVol ?? '');
    setClinicDesc(profile.clinicDesc ?? '');
    setAmenities(profile.amenities ?? []);
    setAccommodation(profile.accommodationProvided ?? false);
  }, [profile]);

  // ── Completion checks (shared with dashboard via hostProfileCompletionPct) ─
  const progressPct = hostProfileCompletionPct({
    clinicName,
    contactFirstName: contactFirst,
    contactLastName: contactLast,
    cpsnsNumber: cpsns,
    speciality: specialties.join(', '),
    address1: addr1,
    address2: addr2,
    postalCode: postal,
    city,
    province,
    practiceType,
    numPhysicians,
    emr,
    patientVol,
    clinicDesc,
    amenities,
    accommodationProvided: accommodation,
  });
  const allDone = progressPct === 100;
  const stepComplete = [
    !!(
      clinicName &&
      contactFirst &&
      contactLast &&
      cpsns &&
      specialties.length
    ),
    !!(addr1 && postal && city && province),
    !!(practiceType && numPhysicians && emr && patientVol),
    amenities.length > 0,
  ];

  function getStatus(n: number): StepStatus {
    if (activeStep === n) return 'active';
    if (stepComplete[n - 1]) return 'complete';
    if (visited.has(n)) return 'incomplete';
    return 'upcoming';
  }

  function goToStep(n: number) {
    setVisited((v) => new Set([...v, n]));
    setActiveStep(n);
  }

  const steps = [
    { n: 1, label: 'Basic Information', sub: 'Your personal identity' },
    { n: 2, label: 'Clinic Information', sub: 'Location & branding' },
    { n: 3, label: 'Practice Details', sub: 'Patient and EMR info' },
    { n: 4, label: 'Services offered', sub: 'Procedures & specialties' },
  ];

  // ── Save handler ─────────────────────────────────────────────────────────
  async function handleSave() {
    setSaveError('');
    const data: HostProfile = {
      clinicName,
      contactFirstName: contactFirst,
      contactLastName: contactLast,
      cpsnsNumber: cpsns,
      speciality: specialties.join(', '),
      licenseFile,
      address1: addr1,
      address2: addr2,
      postalCode: postal,
      city,
      province,
      amenities,
      accommodationProvided: accommodation,
      practiceType,
      numPhysicians,
      emr,
      patientVol,
      clinicDesc,
    };
    try {
      await saveProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Could not save. Please try again.');
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashLayout navItems={NAV} activeHref="/host/profile">
        <div
          style={{
            padding: '40px 36px',
            fontFamily: 'Inter, sans-serif',
            color: '#8892a4',
            fontSize: 14,
          }}
        >
          Loading profile…
        </div>
      </DashLayout>
    );
  }

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <DashLayout navItems={NAV} activeHref="/host/profile">
      <div
        style={{
          padding: '28px 36px 60px',
          maxWidth: 860,
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#0f1523',
            margin: '0 0 3px',
          }}
        >
          {clinicName || 'Your Profile'}
        </h1>
        <p style={{ fontSize: 12, color: '#8892a4', margin: '0 0 16px' }}>
          Define And Manage Organizational, Hierarchy, Departments, And
          Relationships With AI-Powered Insights
        </p>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#8892a4', marginBottom: 4 }}>
            {progressPct}% completed
          </div>
          <div style={{ height: 5, background: '#e2e5ee', borderRadius: 4 }}>
            <div
              style={{
                height: '100%',
                borderRadius: 4,
                width: `${progressPct}%`,
                background: allDone ? '#16a34a' : '#3B4FD8',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Verification banner */}
        {allDone && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                Your profile is under verification
              </div>
              <div style={{ fontSize: 12, color: '#B45309' }}>
                You have successfully completed your profile
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
            overflowX: 'auto',
          }}
        >
          {steps.map((s, i) => {
            const status = getStatus(s.n);
            return (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  onClick={() => goToStep(s.n)}
                  style={{
                    textAlign: 'center',
                    padding: '0 8px 8px',
                    cursor: 'pointer',
                    borderBottom: `2px solid ${stepBorderColor(status)}`,
                    minWidth: 110,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: stepCircleBg(status),
                      color: status === 'upcoming' ? '#8892a4' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      margin: '0 auto 4px',
                    }}
                  >
                    {status === 'complete' ? '✓' : s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: stepLabelColor(status),
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#8892a4' }}>{s.sub}</div>
                </div>
                {i < steps.length - 1 && (
                  <span
                    style={{
                      color: '#d0d4e4',
                      fontSize: 14,
                      padding: '0 2px',
                      paddingBottom: 8,
                    }}
                  >
                    ›
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Section 1: Basic Information ────────────────────────────────── */}
        <div style={sectionCard(activeStep === 1)} onClick={() => goToStep(1)}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#0f1523',
              marginBottom: 14,
            }}
          >
            ⚙️ Basic Information
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#0f1523',
              marginBottom: 12,
            }}
          >
            Clinic Information
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={lbl}>Clinic name</label>
              <input
                style={inp}
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Enter clinic name"
              />
            </div>
            <div>
              <label style={lbl}>Contact Person</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, flex: 1 }}
                  value={contactFirst}
                  onChange={(e) => setContactFirst(e.target.value)}
                  placeholder="First name"
                />
                <input
                  style={{ ...inp, flex: 1 }}
                  value={contactLast}
                  onChange={(e) => setContactLast(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#0f1523',
              marginBottom: 10,
            }}
          >
            Host Doctors
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#F8F9FC',
              border: '1px solid #e2e5ee',
              borderRadius: 6,
              padding: '10px 12px',
              marginBottom: 10,
              width: '48%',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#eef0fb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              ⚙️
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#0f1523' }}>
                {hostFirst || hostLast
                  ? `${hostFirst} ${hostLast}`.trim()
                  : 'Host Doctor 1'}
              </div>
              <div style={{ fontSize: 11, color: '#8892a4' }}>Just Now</div>
            </div>
          </div>
          <button
            style={{
              padding: '7px 14px',
              background: '#fff',
              border: '1.5px dashed #3B4FD8',
              borderRadius: 6,
              fontSize: 13,
              color: '#3B4FD8',
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            + Add Host
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={lbl}>Name</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, flex: 1 }}
                  value={hostFirst}
                  onChange={(e) => setHostFirst(e.target.value)}
                  placeholder="First"
                />
                <input
                  style={{ ...inp, flex: 1 }}
                  value={hostLast}
                  onChange={(e) => setHostLast(e.target.value)}
                  placeholder="Last"
                />
              </div>
            </div>
            <div>
              <label style={lbl}>CPSNS Number *</label>
              <input
                style={inp}
                value={cpsns}
                onChange={(e) => setCpsns(e.target.value)}
                placeholder="Enter CPSNS number"
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>CPSNS License</label>
            {licenseFile ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #d0d4e4',
                  borderRadius: 6,
                  padding: '8px 12px',
                  background: '#F8F9FC',
                }}
              >
                <span style={{ fontSize: 13, color: '#0f1523' }}>
                  {licenseFile}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLicenseFile(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  🗑️
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) =>
                    setLicenseFile(e.target.files?.[0]?.name ?? null)
                  }
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                  style={{
                    ...inp,
                    cursor: 'pointer',
                    color: '#3B4FD8',
                    border: '1.5px dashed #3B4FD8',
                    textAlign: 'left',
                  }}
                >
                  Upload Document ⬆
                </button>
              </>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Speciality *</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 6,
              }}
            >
              {specialties.map((s) => (
                <span
                  key={s}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: '#eef0fb',
                    border: '1px solid #3B4FD8',
                    color: '#3B4FD8',
                    fontSize: 12,
                  }}
                >
                  {s}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpecialties((sp) => sp.filter((x) => x !== s));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#3B4FD8',
                      padding: 0,
                      fontSize: 13,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              style={inp}
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && specialtyInput.trim()) {
                  e.stopPropagation();
                  setSpecialties((sp) => [...sp, specialtyInput.trim()]);
                  setSpecialtyInput('');
                }
              }}
              placeholder="Type speciality and press Enter"
            />
          </div>
        </div>

        {/* ── Section 2: Clinic Location ──────────────────────────────────── */}
        <div style={sectionCard(activeStep === 2)} onClick={() => goToStep(2)}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#0f1523',
              marginBottom: 14,
            }}
          >
            📍 Clinic Location
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 12,
            }}
          >
            <div>
              <label style={lbl}>Address Line 1</label>
              <input
                style={inp}
                value={addr1}
                onChange={(e) => setAddr1(e.target.value)}
                placeholder="Address line 1"
              />
            </div>
            <div>
              <label style={lbl}>Address Line 2</label>
              <input
                style={inp}
                value={addr2}
                onChange={(e) => setAddr2(e.target.value)}
                placeholder="Address line 2"
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Postal Code</label>
            <input
              style={{ ...inp, width: '50%' }}
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              placeholder="Postal code"
            />
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          >
            <div>
              <label style={lbl}>City</label>
              <input
                style={inp}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <label style={lbl}>Province</label>
              <input
                style={inp}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Province"
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Practice Details ─────────────────────────────────── */}
        <div style={sectionCard(activeStep === 3)} onClick={() => goToStep(3)}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#0f1523',
              marginBottom: 14,
            }}
          >
            🏥 Practice Details
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 12,
            }}
          >
            <div>
              <label style={lbl}>Practice Type</label>
              <input
                style={inp}
                value={practiceType}
                onChange={(e) => setPracticeType(e.target.value)}
                placeholder="e.g. Physician"
              />
            </div>
            <div>
              <label style={lbl}>No. of Physicians</label>
              <input
                style={inp}
                value={numPhysicians}
                onChange={(e) => setNumPhysicians(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label style={lbl}>EMR System</label>
              <input
                style={inp}
                value={emr}
                onChange={(e) => setEmr(e.target.value)}
                placeholder="e.g. OSCAR"
              />
            </div>
            <div>
              <label style={lbl}>Patient Volume</label>
              <input
                style={inp}
                value={patientVol}
                onChange={(e) => setPatientVol(e.target.value)}
                placeholder="e.g. 30/day"
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Clinic description</label>
            <textarea
              style={
                { ...inp, height: 64, resize: 'none' } as React.CSSProperties
              }
              value={clinicDesc}
              onChange={(e) => setClinicDesc(e.target.value)}
              placeholder="Describe your clinic..."
            />
          </div>
        </div>

        {/* ── Section 4: Services Offered ─────────────────────────────────── */}
        <div style={sectionCard(activeStep === 4)} onClick={() => goToStep(4)}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#0f1523',
              marginBottom: 14,
            }}
          >
            🔧 Services Offered
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {AMENITY_OPTIONS.map((a) => (
                <span
                  key={a}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAmenities((am) =>
                      am.includes(a) ? am.filter((x) => x !== a) : [...am, a],
                    );
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 12px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    background: amenities.includes(a) ? '#eef0fb' : '#fff',
                    border: `1px solid ${amenities.includes(a) ? '#3B4FD8' : '#e2e5ee'}`,
                    color: amenities.includes(a) ? '#3B4FD8' : '#5a6478',
                    fontSize: 12,
                  }}
                >
                  {a}
                  {amenities.includes(a) && (
                    <span style={{ fontSize: 11 }}>×</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={accommodation}
              onChange={(e) => setAccommodation(e.target.checked)}
            />
            Accommodation provided for Locum physicians
          </label>
        </div>

        {/* Feedback */}
        {saved && (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 12,
              fontSize: 13,
              color: '#166534',
            }}
          >
            ✓ Profile saved successfully.
          </div>
        )}
        {saveError && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 12,
              fontSize: 13,
              color: '#dc2626',
            }}
          >
            {saveError}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 28px',
            background: saving ? '#a5b4fc' : '#3B4FD8',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>
    </DashLayout>
  );
}
