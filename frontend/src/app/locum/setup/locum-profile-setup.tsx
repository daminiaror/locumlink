'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeLandingView } from '@/components/HomeLandingView';
import { useAuth } from '@/providers/AuthProvider';
import { locumApi } from '@/lib/api';
import type { LocumProfile } from '@/types';

/** Frame 1948760021 / 1948760022 / Rectangle 846074 — locum card (6px radius) */
const LOCUM_SETUP_MODAL = {
  widthPx: 476,
  heightPx: 790,
  maxHeight: 'calc(100vh - 40px)',
  paddingPx: 32,
  borderRadiusPx: 6,
  contentWidthPx: 412,
  headerHeightPx: 100,
  /** Step 3 uses same 100px header as steps 1–2 (Frame 1948760037) */
  headerHeightStep3Px: 100,
  formToActionsGapStep1Px: 28,
  formToActionsGapStep2Px: 28,
  /** Frame 1948760053 — gap between upload block and Done */
  formToActionsGapStep3Px: 167,
  bodyTopGapPx: 24,
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.28)',
} as const;

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

/** Frame 1948759951 — locum step 2 fields use 4px radius (not step 1’s 8px) */
const inpStep2: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #D0D5DD',
  borderRadius: 4,
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

/** Frame 1948759951 — locum step 3 upload rows */
const uploadRowShell: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 56,
  height: 56,
  padding: '6px 8px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 29,
  background: 'rgba(58, 101, 219, 0.1)',
  border: '1px dashed rgba(21, 20, 20, 0.4)',
  borderRadius: 8,
  cursor: 'pointer',
};

const uploadRowLabel: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 400,
  lineHeight: '140%',
  color: '#3A65DB',
  fontFamily: 'inherit',
};

const locumModalCardBase: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxSizing: 'border-box',
  width: LOCUM_SETUP_MODAL.widthPx,
  height: LOCUM_SETUP_MODAL.heightPx,
  maxHeight: LOCUM_SETUP_MODAL.maxHeight,
  background: '#FFFFFF',
  borderRadius: LOCUM_SETUP_MODAL.borderRadiusPx,
  padding: LOCUM_SETUP_MODAL.paddingPx,
  boxShadow: LOCUM_SETUP_MODAL.boxShadow,
  zIndex: 10,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', var(--font-family-body, DM Sans, sans-serif)",
};

export default function LocumSetupPage() {
  const router = useRouter();
  const { completeProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState<LocumProfile>({
    firstName: '',
    lastName: '',
    cpsnsNumber: '',
    professionalSummary: '',
    specialization: '',
    address1: '',
    address2: '',
    postalCode: '',
    city: '',
    province: '',
  });

  const licenseRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);
  const [licenseFile, setLicenseFile] = useState('');
  const [resumeFile, setResumeFile] = useState('');
  const [extraFile, setExtraFile] = useState('');

  const step1Valid = useMemo(
    () =>
      (form.firstName ?? '').trim().length > 0 &&
      (form.lastName ?? '').trim().length > 0 &&
      (form.cpsnsNumber ?? '').trim().length > 0 &&
      (form.professionalSummary ?? '').trim().length > 0 &&
      (form.specialization ?? '').trim().length > 0,
    [form],
  );

  const step2Valid = useMemo(
    () =>
      (form.address1 ?? '').trim().length > 0 &&
      (form.postalCode ?? '').trim().length > 0 &&
      (form.city ?? '').trim().length > 0 &&
      (form.province ?? '').trim().length > 0,
    [form.address1, form.postalCode, form.city, form.province],
  );

  const step3Valid = useMemo(
    () => licenseFile.trim().length > 0 && resumeFile.trim().length > 0,
    [licenseFile, resumeFile],
  );

  function set<K extends keyof LocumProfile>(k: K, v: LocumProfile[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleFinish() {
    setBusy(true);
    setErr('');
    try {
      await locumApi.saveProfile(form);
    } catch {
      /* backend not ready yet */
    }
    completeProfile();
    if (typeof window !== 'undefined') {
      window.location.assign('/locum/dashboard');
    } else {
      router.replace('/locum/dashboard');
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
      {/* Same backdrop as host setup: /home landing (non-interactive) + dim overlay */}
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

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(47, 71, 160, 0.45)',
          zIndex: 1,
        }}
      />

      {/* Frame 1948760021 — locum profile card */}
      <div style={locumModalCardBase}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight:
              step === 3
                ? LOCUM_SETUP_MODAL.headerHeightStep3Px
                : LOCUM_SETUP_MODAL.headerHeightPx,
            marginBottom: LOCUM_SETUP_MODAL.bodyTopGapPx,
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
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 300, color: '#000' }}>
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
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
                maxWidth: LOCUM_SETUP_MODAL.contentWidthPx,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
          {/* Step 1 — Frame 1948759988 / Basic Information */}
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
                        <label style={lbl}>First name</label>
                        <input
                          className="locum-setup-input"
                          style={inp}
                          placeholder="John"
                          value={form.firstName}
                          onChange={(e) => set('firstName', e.target.value)}
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
                        <label style={lbl}>Last name</label>
                        <input
                          className="locum-setup-input"
                          style={inp}
                          placeholder="Doe"
                          value={form.lastName}
                          onChange={(e) => set('lastName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        width: '100%',
                      }}
                    >
                      <label style={lbl}>CPSNS Number</label>
                      <input
                        className="locum-setup-input"
                        style={inp}
                        placeholder="Enter CPSNS Number"
                        value={form.cpsnsNumber}
                        onChange={(e) => set('cpsnsNumber', e.target.value)}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        width: '100%',
                      }}
                    >
                      <label style={lbl}>Professional Summary</label>
                      <textarea
                        className="locum-setup-input"
                        style={{
                          ...inp,
                          minHeight: 78,
                          height: 78,
                          resize: 'vertical',
                        }}
                        placeholder="Add Summary"
                        value={form.professionalSummary}
                        onChange={(e) =>
                          set('professionalSummary', e.target.value)
                        }
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
                      <label style={lbl}>Specialization</label>
                      <input
                        className="locum-setup-input"
                        style={inp}
                        placeholder="Add specialization"
                        value={form.specialization}
                        onChange={(e) => set('specialization', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
          )}

          {step === 2 && (
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
                    gap: 16,
                    width: '100%',
                  }}
                >
                  <div style={sectionTitle}>Location</div>
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
                          className="locum-setup-input"
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
                          className="locum-setup-input"
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
                          className="locum-setup-input"
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
                            maxWidth: 200,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <label style={lbl}>City</label>
                          <input
                            className="locum-setup-input"
                            style={inpStep2}
                            placeholder="Add city"
                            value={form.city}
                            onChange={(e) => set('city', e.target.value)}
                          />
                        </div>
                        <div
                          style={{
                            flex: 1,
                            maxWidth: 200,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <label style={lbl}>Province</label>
                          <input
                            className="locum-setup-input"
                            style={inpStep2}
                            placeholder="Add province"
                            value={form.province}
                            onChange={(e) => set('province', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {step === 3 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  width: '100%',
                }}
              >
                  <div style={sectionTitle}>Upload Documents</div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      width: '100%',
                    }}
                  >
                    {/* CPSNS License — Frame 1948759990 */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 8,
                        width: '100%',
                      }}
                    >
                      <label style={{ ...lbl, marginBottom: 0 }}>
                        CPSNS License
                      </label>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => licenseRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            licenseRef.current?.click();
                        }}
                        style={uploadRowShell}
                      >
                        <span
                          style={{
                            ...uploadRowLabel,
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {licenseFile || 'Upload Document'}
                        </span>
                        <UploadCloudIcon />
                      </div>
                      <input
                        ref={licenseRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          setLicenseFile(e.target.files?.[0]?.name ?? '')
                        }
                      />
                    </div>
                    {/* Resume — Frame 1948759991 */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 8,
                        width: '100%',
                      }}
                    >
                      <label style={{ ...lbl, marginBottom: 0 }}>Resume</label>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => resumeRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            resumeRef.current?.click();
                        }}
                        style={uploadRowShell}
                      >
                        <span
                          style={{
                            ...uploadRowLabel,
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {resumeFile || 'Upload Document'}
                        </span>
                        <UploadCloudIcon />
                      </div>
                      <input
                        ref={resumeRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          setResumeFile(e.target.files?.[0]?.name ?? '')
                        }
                      />
                    </div>
                    {/* Additional Documents — Frame 2043683535 */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 8,
                        width: '100%',
                      }}
                    >
                      <label style={{ ...lbl, marginBottom: 0 }}>
                        Additional Documents (Optional)
                      </label>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => extraRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            extraRef.current?.click();
                        }}
                        style={uploadRowShell}
                      >
                        <span
                          style={{
                            ...uploadRowLabel,
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {extraFile || 'Upload Document'}
                        </span>
                        <UploadCloudIcon />
                      </div>
                      <input
                        ref={extraRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          setExtraFile(e.target.files?.[0]?.name ?? '')
                        }
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 16,
                          lineHeight: '140%',
                          fontWeight: 400,
                          fontStyle: 'italic',
                          color: '#636364',
                        }}
                      >
                        -Cover letter, reference letters, etc
                      </p>
                    </div>
                  </div>
                  {err ? (
                    <p style={{ fontSize: 14, color: '#dc2626', margin: 0 }}>
                      {err}
                    </p>
                  ) : null}
              </div>
          )}
            </div>
          </div>

          <div
            style={{
              flexShrink: 0,
              width: '100%',
              maxWidth: LOCUM_SETUP_MODAL.contentWidthPx,
              margin: '0 auto',
              paddingTop:
                step === 1
                  ? LOCUM_SETUP_MODAL.formToActionsGapStep1Px
                  : step === 2
                    ? LOCUM_SETUP_MODAL.formToActionsGapStep2Px
                    : LOCUM_SETUP_MODAL.formToActionsGapStep3Px,
            }}
          >
            {step === 1 && (
              <NavButtons
                onNext={() => setStep(2)}
                disabled={!step1Valid}
              />
            )}
            {step === 2 && (
              <NavButtons
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                disabled={!step2Valid}
                nextGradient
              />
            )}
            {step === 3 && (
              <NavButtons
                onBack={() => setStep(2)}
                onNext={handleFinish}
                nextLabel={busy ? 'Saving…' : 'Done'}
                disabled={busy || !step3Valid}
                nextGradient
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** upload-cloud-01 — 24×24, stroke #3A65DB (Heroicons outline) */
function UploadCloudIcon() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <path
        stroke="#3A65DB"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.33-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
      />
    </svg>
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
      {onBack ? (
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
      ) : null}
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          style={nextStyle}
        >
          {nextLabel}
        </button>
      ) : null}
    </div>
  );
}
