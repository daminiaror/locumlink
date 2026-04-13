'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { HomeLandingView } from '@/components/HomeLandingView';
import { HostSetupStep3 } from '@/components/HostSetupStep3';
import { useAuth } from '@/providers/AuthProvider';
import { hostApi } from '@/lib/api';
import type { HostProfile } from '@/types';

/** Rectangle 846074 — white card; all steps: 476 × 790 (Figma) */
const HOST_SETUP_MODAL = {
  widthPx: 476,
  /** All steps unified at 790px per spec */
  heightPx: 790,
  maxHeight: 'calc(100vh - 40px)',
  paddingPx: 32,
  borderRadiusPx: 10,
  contentWidthPx: 412,
  /** Frame 1948760053 — steps 1–2 */
  headerHeightPx: 100,
  /** Frame 1948760053 — step 3 (taller header: title @32, step @88, bar @128) */
  headerHeightStep3Px: 132,
  formToActionsGapPx: 16,
  formToActionsGapStep2Px: 28,
  formToActionsGapStep3Px: 28,
  bodyTopGapPx: 24,
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.28)',
} as const;

const SPECIALITY_OPTIONS = [
  'Family Physician',
  'Internal medicine',
  'Emergency',
  'ENT',
  'General Practice',
  'Emergency Medicine',
  'Anaesthetics',
  'Paediatrics',
] as const;

function parseSpecialities(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

const inp: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '6px 8px',
  border: '1px solid #D0D5DD',
  borderRadius: 8,
  fontSize: 16,
  lineHeight: '140%',
  color: '#0B0F1F',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

const inpStep2: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #D0D5DD',
  borderRadius: 8,
  fontSize: 16,
  lineHeight: '140%',
  color: '#0B0F1F',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 20,
  fontWeight: 400,
  lineHeight: '140%',
  color: 'rgba(11, 15, 31, 0.8)',
  marginBottom: 8,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 500,
  lineHeight: '140%',
  color: '#0B0F1F',
};

const sectionTitleMuted: React.CSSProperties = {
  ...sectionTitle,
  color: '#4A4A4A',
};

const hostSetupModalCardBase: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxSizing: 'border-box',
  width: HOST_SETUP_MODAL.widthPx,
  height: HOST_SETUP_MODAL.heightPx,
  maxHeight: HOST_SETUP_MODAL.maxHeight,
  background: '#FFFFFF',
  borderRadius: HOST_SETUP_MODAL.borderRadiusPx,
  padding: HOST_SETUP_MODAL.paddingPx,
  boxShadow: HOST_SETUP_MODAL.boxShadow,
  zIndex: 10,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', var(--font-family-body, DM Sans, sans-serif)",
};

export default function HostSetupPage() {
  const router = useRouter();
  const { completeProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState<HostProfile>({
    clinicName: '',
    contactFirstName: '',
    contactLastName: '',
    cpsnsNumber: '',
    speciality: '',
    address1: '',
    address2: '',
    postalCode: '',
    city: '',
    province: '',
    amenities: [],
    accommodationProvided: false,
  });

  const [specialityTags, setSpecialityTags] = useState<string[]>([]);

  useEffect(() => {
    setSpecialityTags(parseSpecialities(form.speciality));
  }, []);

  const step1Valid = useMemo(
    () =>
      form.clinicName.trim().length > 0 &&
      form.contactFirstName.trim().length > 0 &&
      specialityTags.length > 0,
    [form.clinicName, form.contactFirstName, specialityTags],
  );

  function set<K extends keyof HostProfile>(k: K, v: HostProfile[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function updateSpecialityTags(tags: string[]) {
    setSpecialityTags(tags);
    setForm((f) => ({ ...f, speciality: tags.join(', ') }));
  }

  async function handleFinish() {
    setBusy(true);
    setErr('');
    try {
      await hostApi.saveProfile(form);
    } catch {
      /* backend not ready yet */
    }
    completeProfile();
    if (typeof window !== 'undefined') {
      window.location.assign('/host/dashboard');
    } else {
      router.replace('/host/dashboard');
    }
    setBusy(false);
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-family-body, DM Sans, sans-serif)',
      }}
    >
      {/* ── Layer 1: Main landing page (same as /home) as non-interactive backdrop ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <HomeLandingView
          interactive={false}
          rootStyle={{ height: '100%', maxHeight: '100%' }}
        />
      </div>

      {/* ── Layer 2: Blue-tinted dimming overlay ───────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(47, 71, 160, 0.45)',
          zIndex: 1,
        }}
      />

      {/* ── Layer 3: Profile card — 476 × 790 for all steps ─────────────── */}
      <div style={hostSetupModalCardBase}>
        {/* ── Header ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight:
              step === 3
                ? HOST_SETUP_MODAL.headerHeightStep3Px
                : HOST_SETUP_MODAL.headerHeightPx,
            marginBottom: HOST_SETUP_MODAL.bodyTopGapPx,
          }}
        >
          <button
            type="button"
            onClick={() => router.push('/home')}
            aria-label="Close"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 36,
              height: 36,
              borderRadius: 38,
              border: 'none',
              background: '#F8F6F7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: '#000000',
                lineHeight: 1,
              }}
            >
              ×
            </span>
          </button>

          <h2
            style={{
              margin: 0,
              padding: '0 44px',
              textAlign: 'center',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: '100%',
              color: '#0A0A0A',
            }}
          >
            Complete your Profile
          </h2>
          <p
            style={{
              margin: '28px 0 0',
              textAlign: 'center',
              fontSize: 20,
              fontWeight: 400,
              lineHeight: '100%',
              color: '#7C7C7C',
            }}
          >
            Step {step} of 3
          </p>

          {/* Progress bar — 3 segments */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              marginTop: 20,
              height: 4,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  boxSizing: 'border-box',
                  height: 4,
                  borderBottomWidth: 4,
                  borderBottomStyle: 'solid',
                  borderBottomColor: i <= step ? '#0F2AAF' : '#F8F6F7',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Body: scrollable fields + fixed footer (Next/Back always visible) ── */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: HOST_SETUP_MODAL.contentWidthPx,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              {/* ── Step 1: Basic Info ── */}
              {step === 1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    width: '100%',
                  }}
                >
                  <div style={sectionTitle}>Basic Information</div>
                  <div>
                    <label style={lbl}>Clinic name*</label>
                    <input
                      className="host-setup-input"
                      style={inp}
                      placeholder="Enter Clinic name"
                      value={form.clinicName}
                      onChange={(e) => set('clinicName', e.target.value)}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 24,
                    }}
                  >
                    <div style={sectionTitleMuted}>Host Doctor</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={lbl}>First name*</label>
                        <input
                          className="host-setup-input"
                          style={inp}
                          placeholder="John"
                          value={form.contactFirstName}
                          onChange={(e) =>
                            set('contactFirstName', e.target.value)
                          }
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={lbl}>Last name</label>
                        <input
                          className="host-setup-input"
                          style={inp}
                          placeholder="Doe"
                          value={form.contactLastName}
                          onChange={(e) =>
                            set('contactLastName', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>CPSNS Number</label>
                      <input
                        className="host-setup-input"
                        style={inp}
                        placeholder="Enter CPSNS number"
                        value={form.cpsnsNumber}
                        onChange={(e) => set('cpsnsNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={lbl}>Speciality</label>
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <select
                          className="host-setup-input host-setup-select"
                          style={{
                            ...inp,
                            width: '100%',
                            paddingRight: 36,
                            color: '#0B0F1F',
                          }}
                          value=""
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v && !specialityTags.includes(v)) {
                              updateSpecialityTags([...specialityTags, v]);
                            }
                            e.target.selectedIndex = 0;
                          }}
                        >
                          <option value="">Pick Speciality</option>
                          {SPECIALITY_OPTIONS.filter(
                            (o) => !specialityTags.includes(o),
                          ).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <span
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            fontSize: 10,
                            lineHeight: 1,
                            color: '#000000',
                          }}
                          aria-hidden
                        >
                          ▼
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignContent: 'flex-start',
                          gap: 12,
                          minHeight: 44,
                          width: '100%',
                        }}
                      >
                        {specialityTags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '10px',
                              borderRadius: 40,
                              background: 'rgba(115, 177, 251, 0.1)',
                              color: '#1522A6',
                              fontSize: 16,
                              lineHeight: '100%',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                updateSpecialityTags(
                                  specialityTags.filter((t) => t !== tag),
                                )
                              }
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 8,
                                height: 8,
                                padding: 0,
                                border: '1.5px solid #1522A6',
                                borderRadius: 2,
                                background: 'transparent',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                              aria-label={`Remove ${tag}`}
                            >
                              <span
                                style={{
                                  fontSize: 6,
                                  lineHeight: 1,
                                  color: '#1522A6',
                                  fontWeight: 700,
                                }}
                              >
                                ×
                              </span>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Clinic Location ── */}
              {step === 2 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    width: '100%',
                  }}
                >
                  <div style={sectionTitle}>Clinic Location</div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 24,
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          width: '100%',
                        }}
                      >
                        <label style={lbl}>Address Line 1</label>
                        <input
                          style={inpStep2}
                          placeholder="Location Address Line 1"
                          value={form.address1}
                          onChange={(e) => set('address1', e.target.value)}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          width: '100%',
                        }}
                      >
                        <label style={lbl}>Address Line 2</label>
                        <input
                          style={inpStep2}
                          placeholder="Location Address Line 2"
                          value={form.address2}
                          onChange={(e) => set('address2', e.target.value)}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          width: '100%',
                        }}
                      >
                        <label style={lbl}>Postal Code</label>
                        <input
                          style={inpStep2}
                          placeholder="Enter valid 6 digit code"
                          value={form.postalCode}
                          onChange={(e) => set('postalCode', e.target.value)}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          gap: 12,
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <label style={lbl}>City</label>
                          <input
                            style={inpStep2}
                            placeholder="Add City"
                            value={form.city}
                            onChange={(e) => set('city', e.target.value)}
                          />
                        </div>
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <label style={lbl}>Province</label>
                          <input
                            style={inpStep2}
                            placeholder="Add Province"
                            value={form.province}
                            onChange={(e) => set('province', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Services — AmenitiesSelector ── */}
              {step === 3 && (
                <div className="host-setup-step3-stack">
                  <HostSetupStep3
                    amenities={form.amenities}
                    onAmenitiesChange={(items) =>
                      setForm((f) => ({ ...f, amenities: items }))
                    }
                    accommodationProvided={form.accommodationProvided}
                    onAccommodationChange={(value) =>
                      set('accommodationProvided', value)
                    }
                  />
                  {err && (
                    <p style={{ fontSize: 14, color: '#dc2626' }}>{err}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fixed footer: always visible */}
          <div
            style={{
              flexShrink: 0,
              width: '100%',
              maxWidth: HOST_SETUP_MODAL.contentWidthPx,
              margin: '0 auto',
              paddingTop:
                step === 1
                  ? HOST_SETUP_MODAL.formToActionsGapPx
                  : step === 2
                    ? HOST_SETUP_MODAL.formToActionsGapStep2Px
                    : HOST_SETUP_MODAL.formToActionsGapStep3Px,
            }}
          >
            {step === 1 && (
              <NavButtons onNext={() => setStep(2)} disabled={!step1Valid} />
            )}
            {step === 2 && (
              <NavButtons
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextGradient
              />
            )}
            {step === 3 && (
              <NavButtons
                onBack={() => setStep(2)}
                onNext={handleFinish}
                nextLabel={busy ? 'Saving…' : 'Next'}
                disabled={busy}
                nextGradient
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Next',
  disabled = false,
  nextGradient = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  disabled?: boolean;
  nextGradient?: boolean;
}) {
  const nextBase: React.CSSProperties = {
    flex: 2,
    minHeight: nextGradient ? 48 : 44,
    padding: nextGradient ? '10px 12px' : '6px 8px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 500,
    lineHeight: '140%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  };

  const nextStyle: React.CSSProperties = nextGradient
    ? {
        ...nextBase,
        fontSize: 20,
        background: disabled
          ? '#D1D5DB'
          : 'linear-gradient(270deg, #3A65DB 0%, #1B31D2 100%)',
        color: disabled ? 'rgba(107, 114, 128, 0.7)' : '#FFFFFF',
      }
    : {
        ...nextBase,
        fontSize: 18,
        background: disabled ? '#D1D5DB' : '#3B4FD8',
        color: disabled ? 'rgba(107, 114, 128, 0.7)' : '#fff',
      };

  return (
    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            minHeight: 44,
            padding: '6px 8px',
            background: '#fff',
            color: '#5a6478',
            border: '1px solid #D0D5DD',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Back
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          style={nextStyle}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
