'use client';
import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashLayout, { NavIcon } from '@/components/DashLayout';
import { ProfileStatusGlyph, type ProfileStatusGlyphVariant, } from '@/components/ProfileStatusGlyph';
import { locumApi, uploadFile } from '@/lib/api';
import { buildLocumSavePayload } from '@/lib/locumProfilePayload';
import { useNextPageClientProps } from '@/lib/use-next-page-client-props';
import type { LocumProfile } from '@/types';
import { isCpsnsNineDigitsFormat, isCpsnsVerified, sanitizeCpsnsInput, } from '@/lib/cpsnsVerify';
import { locumProfileCompletionPct } from '@/lib/locumProfileCompletion';
import { beforeClientNavigation } from '@/lib/topLoader';
import citiesRaw from '@/data/cities.json';
const NAV = [
    { label: 'Browse Opportunities', href: '/locum/browse', icon: <NavIcon name="browse"/> },
    { label: 'My Applications', href: '/locum/dashboard', icon: <NavIcon name="postings"/> },
    { label: 'Profile', href: '/locum/profile', icon: <NavIcon name="profile"/> },
    { label: 'Messages', href: '/locum/messages', icon: <NavIcon name="messages"/> },
    { label: 'Resources', href: '/locum/resources', icon: <NavIcon name="resources"/> },
];
const SPECIALITY_OPTIONS = [
    'Family Physician', 'Internal medicine', 'Emergency', 'ENT',
    'General Practice', 'Emergency Medicine', 'Anaesthetics', 'Paediatrics',
];
type CityEntry = {
    name: string;
    province: string;
};
const CITY_ROWS: CityEntry[] = (citiesRaw as [
    string,
    string
][]).map(([name, province]) => ({ name, province }));
type VerificationStatus = 'pending' | 'under-review' | 'verified';
const cityHighlight: React.CSSProperties = {
    background: 'rgba(59, 79, 216, 0.12)',
    color: '#1B31D2',
    borderRadius: 3,
    padding: '0 2px',
    fontWeight: 600,
};
function highlightCityMatch(text: string, query: string): React.ReactNode {
    const q = query.trim();
    if (!q)
        return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0)
        return text;
    return (<>
      {text.slice(0, idx)}
      <mark style={cityHighlight}>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>);
}
const inp: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    minHeight: 37,
    border: '1px solid #D0D5DD',
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
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    fontSize: 16,
    lineHeight: '140%',
    letterSpacing: 0,
    color: '#374151',
    marginBottom: 5,
};
const documentFormatHint: React.CSSProperties = {
    fontSize: 12,
    color: '#8892a4',
    margin: '6px 0 0',
    lineHeight: 1.4,
};
type StepStatus = 'complete' | 'active' | 'incomplete' | 'upcoming';
function stepBorderColor(s: StepStatus) {
    if (s === 'complete')
        return '#16a34a';
    if (s === 'active')
        return '#3B4FD8';
    if (s === 'incomplete')
        return '#f97316';
    return '#e2e5ee';
}
function stepCircleBg(s: StepStatus) {
    if (s === 'complete')
        return '#16a34a';
    if (s === 'active')
        return '#3B4FD8';
    if (s === 'incomplete')
        return '#f97316';
    return '#e2e5ee';
}
function stepTextColor(s: StepStatus) {
    if (s === 'complete')
        return '#16a34a';
    if (s === 'active')
        return '#3B4FD8';
    if (s === 'incomplete')
        return '#f97316';
    return '#8892a4';
}
function VerificationBanner({ status }: {
    status: VerificationStatus;
}) {
    const config = {
        pending: {
            glyph: 'pendingStaff' as ProfileStatusGlyphVariant,
            title: 'Profile submitted — pending review',
            sub: 'We will notify you once your profile has been reviewed.',
            bg: '#FFFBEB', border: '#FDE68A', titleColor: '#92400E', subColor: '#B45309',
        },
        'under-review': {
            glyph: 'underReview' as ProfileStatusGlyphVariant,
            title: 'CPSNS not verified yet',
            sub: 'Your profile is complete, but your CPSNS number must match our verified list before you can apply to jobs.',
            bg: '#EFF6FF', border: '#BFDBFE', titleColor: '#1E40AF', subColor: '#3B82F6',
        },
        verified: {
            glyph: 'verified' as ProfileStatusGlyphVariant,
            title: 'Profile verified',
            sub: 'You are verified and can now apply to locum opportunities.',
            bg: '#F3F4F6',
            border: '#E5E7EB',
            titleColor: '#0f1523',
            subColor: '#6B7280',
        },
    }[status];
    return (<div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: config.bg, border: `1px solid ${config.border}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
        }}>
      <ProfileStatusGlyph variant={config.glyph} size={36}/>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: config.titleColor }}>{config.title}</div>
        <div style={{ fontSize: 12, color: config.subColor }}>{config.sub}</div>
      </div>
    </div>);
}
export default function LocumProfilePage(props: {
    params?: Promise<Record<string, string | string[] | undefined>>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    useNextPageClientProps(props);
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(1);
    const [visited, setVisited] = useState<Set<number>>(new Set([1]));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [cpsns, setCpsns] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>('');
    const [summary, setSummary] = useState('');
    const [speciality, setSpeciality] = useState('');
    const [specialityTags, setSpecialityTags] = useState<string[]>([]);
    const [addr1, setAddr1] = useState('');
    const [addr2, setAddr2] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [licenseFile, setLicenseFile] = useState('');
    const [resumeFile, setResumeFile] = useState('');
    const [extraFile, setExtraFile] = useState('');
    const [licenseViewUrl, setLicenseViewUrl] = useState<string | null>(null);
    const [resumeViewUrl, setResumeViewUrl] = useState<string | null>(null);
    const [extraViewUrl, setExtraViewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    const licenseRef = useRef<HTMLInputElement>(null);
    const resumeRef = useRef<HTMLInputElement>(null);
    const extraRef = useRef<HTMLInputElement>(null);
    const cityInputRef = useRef<HTMLInputElement>(null);
    const cityDropRef = useRef<HTMLDivElement>(null);
    const cityBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stepSectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const [cityResults, setCityResults] = useState<CityEntry[]>([]);
    const [cityDropOpen, setCityDropOpen] = useState(false);
    const [cityActiveIdx, setCityActiveIdx] = useState(-1);
    function searchCities(qRaw: string) {
        const q = qRaw.trim().toLowerCase();
        if (q.length < 2) {
            setCityResults([]);
            setCityDropOpen(false);
            setCityActiveIdx(-1);
            return;
        }
        const starts = CITY_ROWS.filter((c) => c.name.toLowerCase().startsWith(q)).slice(0, 8);
        const seen = new Set(starts.map((c) => `${c.name}|${c.province}`));
        const contains = starts.length < 8
            ? CITY_ROWS.filter((c) => !seen.has(`${c.name}|${c.province}`) &&
                c.name.toLowerCase().includes(q)).slice(0, 8 - starts.length)
            : [];
        setCityResults([...starts, ...contains]);
        setCityActiveIdx(-1);
        setCityDropOpen(true);
    }
    function handleCitySelect(nextCity: CityEntry) {
        setCity(nextCity.name);
        setProvince(nextCity.province);
        setCityResults([]);
        setCityDropOpen(false);
        setCityActiveIdx(-1);
    }
    function handleCityKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (!cityDropOpen)
            return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCityActiveIdx((idx) => Math.min(idx + 1, cityResults.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCityActiveIdx((idx) => Math.max(idx - 1, 0));
        }
        if (e.key === 'Enter' && cityActiveIdx >= 0 && cityResults[cityActiveIdx]) {
            e.preventDefault();
            handleCitySelect(cityResults[cityActiveIdx]);
        }
        if (e.key === 'Escape')
            setCityDropOpen(false);
    }
    useEffect(() => {
        locumApi.getProfile()
            .then((data) => {
            const typed = data as unknown as {
                exists: boolean;
                profile: LocumProfile | null;
            };
            if (!typed.exists || !typed.profile)
                return;
            const p = typed.profile;
            setFirstName(p.firstName ?? '');
            setLastName(p.lastName ?? '');
            setCpsns(p.cpsnsNumber ?? '');
            setYearsOfExperience(typeof (p as {
                yearsOfExperience?: unknown;
            }).yearsOfExperience ===
                'number'
                ? ((p as {
                    yearsOfExperience: number;
                }).yearsOfExperience ?? 0)
                : '');
            setSummary(p.professionalSummary ?? '');
            setSpeciality(p.specialization ?? '');
            setSpecialityTags(p.specialization
                ? p.specialization.split(',').map((s: string) => s.trim()).filter(Boolean)
                : []);
            setAddr1(p.address1 ?? '');
            setAddr2(p.address2 ?? '');
            setPostalCode(p.postalCode ?? '');
            setCity(p.city ?? '');
            setProvince(p.province ?? '');
            const lf = p.licenseFile ?? p.licenseFileName ?? '';
            const rf = p.resumeFile ?? p.resumeFileName ?? '';
            const xf = p.extraFile ?? p.extraFileName ?? '';
            setLicenseFile(lf);
            setResumeFile(rf);
            setExtraFile(xf);
            setLicenseViewUrl(/^https?:\/\//.test(lf) ? lf : null);
            setResumeViewUrl(/^https?:\/\//.test(rf) ? rf : null);
            setExtraViewUrl(/^https?:\/\//.test(xf) ? xf : null);
        })
            .catch((e: unknown) => {
            const msg = e instanceof Error ? e.message : 'Could not load profile data.';
            setLoadError(msg);
        });
    }, []);
    const step1Done = !!(firstName &&
        lastName &&
        isCpsnsNineDigitsFormat(cpsns) &&
        summary &&
        specialityTags.length);
    const step2Done = !!(addr1 && postalCode && city && province);
    const step3Done = !!(licenseFile && resumeFile);
    const stepDone = [step1Done, step2Done, step3Done];
    const profileDraft = useMemo((): LocumProfile => ({
        firstName,
        lastName,
        cpsnsNumber: cpsns,
        yearsOfExperience: yearsOfExperience === '' ? null : Math.max(0, yearsOfExperience),
        professionalSummary: summary,
        specialization: specialityTags.join(', '),
        address1: addr1,
        address2: addr2,
        postalCode,
        city,
        province,
        licenseFile,
        resumeFile,
        extraFile,
    }), [
        firstName,
        lastName,
        cpsns,
        yearsOfExperience,
        summary,
        specialityTags,
        addr1,
        addr2,
        postalCode,
        city,
        province,
        licenseFile,
        resumeFile,
        extraFile,
    ]);
    const progressPct = locumProfileCompletionPct(profileDraft);
    const allStepsDone = progressPct === 100;
    const profileVerificationStatus: VerificationStatus = allStepsDone
        ? isCpsnsVerified(cpsns)
            ? 'verified'
            : 'under-review'
        : 'pending';
    function getStatus(n: number): StepStatus {
        const idx = n - 1;
        if (activeStep === n)
            return 'active';
        if (stepDone[idx])
            return 'complete';
        if (visited.has(n))
            return 'incomplete';
        return 'upcoming';
    }
    function goToStep(n: number) {
        setVisited((v) => new Set([...v, n]));
        setActiveStep(n);
    }
    function handleStepNavClick(n: number) {
        goToStep(n);
        requestAnimationFrame(() => {
            stepSectionRefs.current[n]?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }
    async function handleSave() {
        setSaving(true);
        setSaved(false);
        try {
            await locumApi.saveProfile(buildLocumSavePayload({
                firstName,
                lastName,
                cpsnsNumber: cpsns,
                yearsOfExperience: yearsOfExperience === '' ? null : Math.max(0, yearsOfExperience),
                professionalSummary: summary,
                specialization: specialityTags.join(', '),
                address1: addr1,
                address2: addr2,
                postalCode,
                city,
                province,
            }, { licenseFile, resumeFile, extraFile }));
            setSaved(true);
            window.setTimeout(() => {
                beforeClientNavigation('/locum/dashboard');
                router.push('/locum/dashboard');
            }, 900);
        }
        catch {
            setLoadError('Failed to save. Please try again.');
        }
        finally {
            setSaving(false);
        }
    }
    const steps = [
        { n: 1, label: 'Basic Information', sub: 'Your personal identity' },
        { n: 2, label: 'Location', sub: 'Location & branding' },
        { n: 3, label: 'Relevant Documents', sub: 'Licence & documents' },
    ];
    const sectionBorder = (n: number) => {
        const s = getStatus(n);
        return `1px solid ${stepBorderColor(s)}`;
    };
    return (<DashLayout navItems={NAV} activeHref="/locum/profile" topbarFirstName={firstName} topbarLastName={lastName}>
      
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1523', marginBottom: 3 }}>
        Welcome
      </h1>

      
      {allStepsDone ? (<VerificationBanner status={profileVerificationStatus}/>) : null}

      
      <div style={{
            width: '100%',
            maxWidth: '100%',
            marginBottom: 20,
            fontFamily: 'Inter, var(--font-family-body, DM Sans), sans-serif',
        }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            minHeight: 48,
            marginBottom: 10,
        }}>
          {steps.flatMap((s, i) => {
            const status = getStatus(s.n);
            const isDone = status === 'complete';
            const isActive = status === 'active';
            const showFilled = isDone || isActive;
            const stepBlock = (<div key={s.n} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: '1 1 220px',
                    minWidth: 200,
                    cursor: 'pointer',
                }} onClick={() => handleStepNavClick(s.n)}>
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDone
                        ? '#16a34a'
                        : isActive
                            ? '#1522A6'
                            : 'transparent',
                    border: showFilled
                        ? 'none'
                        : '1px solid rgba(21, 20, 20, 0.4)',
                    boxSizing: 'border-box',
                    color: showFilled ? '#fff' : '#6B7280',
                    fontSize: 18,
                    fontWeight: 500,
                    lineHeight: 1,
                }}>
                  {isDone ? '✓' : s.n}
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    minWidth: 0,
                }}>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: '#0B0F1F',
                }}>
                    {s.label}
                  </div>
                </div>
              </div>);
            if (i < steps.length - 1) {
                return [
                    stepBlock,
                    <span key={`sep-${s.n}`} style={{
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color: '#210840',
                            opacity: 0.55,
                        }} aria-hidden>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-90deg)' }}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>,
                ];
            }
            return [stepBlock];
        })}
        </div>

        
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#8892a4',
            marginBottom: 4,
        }}>
          <span>{progressPct}% completed</span>
        </div>
        <div style={{ width: '100%' }}>
          <div style={{
            height: 6,
            borderRadius: 3,
            background: '#E5E7EB',
            overflow: 'hidden',
        }}>
            <div style={{
            height: '100%',
            width: `${progressPct}%`,
            borderRadius: 3,
            background: progressPct === 100
                ? '#16a34a'
                : 'linear-gradient(270deg, #3A65DB 0%, #1B31D2 100%)',
            transition: 'width 0.4s ease',
        }}/>
          </div>
          <div style={{
            marginTop: 8,
            borderTop: '1px solid #D1D5DB',
            width: '100%',
        }}/>
        </div>
      </div>

      {loadError && (<div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{loadError}</div>)}

      
      
      
      <div ref={(node) => {
            stepSectionRefs.current[1] = node;
        }} onClick={() => goToStep(1)} style={{
            background: '#fff', border: sectionBorder(1),
            borderRadius: 8, padding: 20, marginBottom: 16, cursor: 'pointer',
        }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            opacity: 1,
        }}>
            <Image src="/basic-information.png" alt="" width={24} height={24} style={{ objectFit: 'cover' }}/>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0f1523' }}>
            Basic Information
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
          <div>
            <label style={lbl}>First Name</label>
            <input style={inp} value={firstName} onChange={(e) => setFirstName(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="First name"/>
          </div>
          <div>
            <label style={lbl}>Last Name</label>
            <input style={inp} value={lastName} onChange={(e) => setLastName(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Last name"/>
          </div>
        </div>
        
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 12,
        }}>
          <div>
            <label style={lbl}>CPSNS Number</label>
            <input style={inp} inputMode="numeric" autoComplete="off" maxLength={9} value={cpsns} onChange={(e) => setCpsns(sanitizeCpsnsInput(e.target.value))} onClick={(e) => e.stopPropagation()} placeholder="License number"/>
          </div>
          <div>
            <label style={lbl}>Years of experience</label>
            <input style={inp} type="number" inputMode="numeric" min={0} step={1} value={yearsOfExperience} onChange={(e) => {
            const v = e.target.value;
            if (!v) {
                setYearsOfExperience('');
                return;
            }
            const n = Math.trunc(Number(v));
            if (!Number.isFinite(n))
                return;
            setYearsOfExperience(Math.max(0, n));
        }} onClick={(e) => e.stopPropagation()} placeholder="e.g. 5"/>
          </div>
        </div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 12,
        }}>
          <div>
            <label style={lbl}>Professional Summary</label>
            <textarea style={{
            ...inp,
            minHeight: 37,
            height: 68,
            resize: 'none',
            lineHeight: 1.45,
        } as React.CSSProperties} value={summary} onChange={(e) => setSummary(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Professional Summary "/>
          </div>
          <div aria-hidden/>
        </div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 10,
        }}>
          <div>
            <label style={lbl}>Speciality</label>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <select style={{
            ...inp,
            minHeight: 37,
            height: 37,
            paddingRight: 32,
            appearance: 'none',
        }} value="" onClick={(e) => e.stopPropagation()} onChange={(e) => {
            const v = e.target.value;
            if (v && !specialityTags.includes(v)) {
                setSpecialityTags((t) => [...t, v]);
            }
            e.target.selectedIndex = 0;
        }}>
                <option value="">Pick Speciality</option>
                {SPECIALITY_OPTIONS.filter((o) => !specialityTags.includes(o)).map((o) => (<option key={o} value={o}>{o}</option>))}
              </select>
              <span style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: 10,
            color: '#000',
        }}>
                ▼
              </span>
            </div>
          </div>
          <div aria-hidden/>
        </div>
        <div style={{ marginBottom: 0 }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {specialityTags.map((tag) => (<span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20,
                background: '#eef0fb', border: '1px solid #3B4FD8',
                color: '#3B4FD8', fontSize: 12,
            }}>
                {tag}
                <button onClick={(e) => { e.stopPropagation(); setSpecialityTags((t) => t.filter((x) => x !== tag)); }} style={{ background: 'none', border: 'none', color: '#8892a4', cursor: 'pointer', padding: 0, fontSize: 13 }}>×</button>
              </span>))}
          </div>
        </div>
      </div>

      
      
      
      <div ref={(node) => {
            stepSectionRefs.current[2] = node;
        }} onClick={() => goToStep(2)} style={{
            background: '#fff', border: sectionBorder(2),
            borderRadius: 8, padding: 20, marginBottom: 16, cursor: 'pointer',
        }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            opacity: 1,
        }}>
            <Image src="/location.png" alt="" width={24} height={24} style={{ objectFit: 'contain' }}/>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0f1523' }}>
            Location
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Address Line 1</label>
            <input style={inp} value={addr1} onChange={(e) => setAddr1(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Address Line 1"/>
          </div>
          <div>
            <label style={lbl}>Address Line 2</label>
            <input style={inp} value={addr2} onChange={(e) => setAddr2(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Address Line 2"/>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <label style={lbl}>City</label>
            <input ref={cityInputRef} style={inp} value={city} onChange={(e) => {
            setCity(e.target.value);
            searchCities(e.target.value);
        }} onClick={(e) => e.stopPropagation()} onKeyDown={handleCityKeyDown} onFocus={() => {
            if (cityBlurTimer.current != null)
                clearTimeout(cityBlurTimer.current);
            if (cityResults.length)
                setCityDropOpen(true);
        }} onBlur={() => {
            cityBlurTimer.current = setTimeout(() => setCityDropOpen(false), 160);
        }} placeholder="City" autoComplete="off"/>
            {cityDropOpen && (<div ref={cityDropRef} style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                zIndex: 30,
                background: '#fff',
                border: '1px solid #E4E8F0',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                maxHeight: 220,
                overflowY: 'auto',
            }}>
              {cityResults.length === 0 ? (<div style={{
                    padding: '12px 14px',
                    fontSize: 'var(--font-small)',
                    color: '#8892a4',
                    textAlign: 'center',
                }}>
                  No city found
                </div>) : (cityResults.map((entry, idx) => (<div key={`${entry.name}-${entry.province}`} role="option" aria-selected={idx === cityActiveIdx} onMouseDown={() => handleCitySelect(entry)} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    background: idx === cityActiveIdx ? 'rgba(59, 79, 216, 0.08)' : 'transparent',
                    borderBottom: '1px solid rgba(226, 229, 238, 0.7)',
                }}>
                  <span style={{ fontSize: 'var(--font-body)', fontWeight: 'var(--font-weight-bold)', color: '#0f1523' }}>
                    {highlightCityMatch(entry.name, city)}
                  </span>
                  <span style={{
                        fontSize: 'var(--font-small)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: '#1B31D2',
                        background: 'rgba(59, 79, 216, 0.1)',
                        borderRadius: 20,
                        padding: '2px 8px',
                        flexShrink: 0,
                    }}>
                    {entry.province}
                  </span>
                </div>)))}
            </div>)}
          </div>
          <div>
            <label style={lbl}>Province</label>
            <input style={inp} value={province} onChange={(e) => setProvince(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Province"/>
          </div>
        </div>
        <div>
          <label style={lbl}>Postal Code</label>
          <input style={{ ...inp, width: '50%' }} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Postal code"/>
        </div>
      </div>

      
      
      
      <div ref={(node) => {
            stepSectionRefs.current[3] = node;
        }} onClick={() => goToStep(3)} style={{
            background: '#fff', border: sectionBorder(3),
            borderRadius: 8, padding: 20, marginBottom: 16, cursor: 'pointer',
        }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            opacity: 1,
        }}>
            <Image src="/relevant-docs.png" alt="" width={24} height={24} style={{ objectFit: 'contain' }}/>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0f1523' }}>
            Relevant Documents
          </span>
        </div>

        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          
          <div>
          <label style={lbl}>
            CPSNS License
          </label>
          <div onClick={(e) => {
            e.stopPropagation();
            if (licenseFile && licenseViewUrl) {
                window.open(licenseViewUrl, '_blank', 'noopener,noreferrer');
                return;
            }
            licenseRef.current?.click();
        }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: licenseFile ? '1px solid #3B4FD8' : '1px solid #e2e5ee',
            borderRadius: 6, padding: '9px 12px', cursor: 'pointer',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
              <Image src="/document-link.png" alt="" width={24} height={24} style={{ flexShrink: 0, opacity: 1, objectFit: 'contain' }}/>
              <span style={{ fontSize: 13, color: licenseFile ? '#3B4FD8' : '#8892a4' }}>
                {uploading === 'license'
            ? 'Uploading…'
            : licenseFile
                ? licenseFile.split('/').pop()
                : 'CPSNS License'}
              </span>
              {licenseFile ? (<button type="button" aria-label="Delete CPSNS License" onClick={(e) => {
            e.stopPropagation();
            setLicenseFile('');
            setLicenseViewUrl(null);
        }} style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            background: 'transparent',
            border: 'none',
            color: '#dc2626',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
        }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M6 7l1 14h10l1-14M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>) : null}
            </div>
          </div>
          <p style={documentFormatHint}>Accepted formats: PDF, DOC, DOCX.</p>
          <input ref={licenseRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            setUploading('license');
            try {
                const result = await uploadFile(file, 'locum/license');
                setLicenseFile(result.path);
                setLicenseViewUrl(result.signedUrl);
            }
            catch {
                alert('Upload failed. Try again.');
            }
            finally {
                setUploading(null);
                e.target.value = '';
            }
        }}/>
          </div>

          
          <div>
          <label style={lbl}>
            Resume
          </label>
          <div onClick={(e) => {
            e.stopPropagation();
            if (resumeFile && resumeViewUrl) {
                window.open(resumeViewUrl, '_blank', 'noopener,noreferrer');
                return;
            }
            resumeRef.current?.click();
        }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: resumeFile ? '1px solid #3B4FD8' : '1px solid #e2e5ee',
            borderRadius: 6, padding: '9px 12px', cursor: 'pointer',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
              <Image src="/document-link.png" alt="" width={24} height={24} style={{ flexShrink: 0, opacity: 1, objectFit: 'contain' }}/>
              <span style={{ fontSize: 13, color: resumeFile ? '#3B4FD8' : '#8892a4' }}>
                {uploading === 'resume'
            ? 'Uploading…'
            : resumeFile
                ? resumeFile.split('/').pop()
                : 'Resume'}
              </span>
              {resumeFile ? (<button type="button" aria-label="Delete Resume" onClick={(e) => {
            e.stopPropagation();
            setResumeFile('');
            setResumeViewUrl(null);
        }} style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            background: 'transparent',
            border: 'none',
            color: '#dc2626',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
        }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M6 7l1 14h10l1-14M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>) : null}
            </div>
          </div>
          <p style={documentFormatHint}>Accepted formats: PDF, DOC, DOCX.</p>
          <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            setUploading('resume');
            try {
                const result = await uploadFile(file, 'locum/resume');
                setResumeFile(result.path);
                setResumeViewUrl(result.signedUrl);
            }
            catch {
                alert('Upload failed. Try again.');
            }
            finally {
                setUploading(null);
                e.target.value = '';
            }
        }}/>
          </div>
        </div>

        
        <label style={lbl}>Additional documents</label>
        <p style={{ fontSize: 12, color: '#8892a4', margin: '0 0 8px' }}>-Cover letter, reference letters, etc</p>
        <div onClick={(e) => {
            e.stopPropagation();
            if (extraFile && extraViewUrl) {
                window.open(extraViewUrl, '_blank', 'noopener,noreferrer');
                return;
            }
            extraRef.current?.click();
        }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: extraFile ? '1px solid #3B4FD8' : '1px solid #e2e5ee',
            borderRadius: 6, padding: '9px 12px', cursor: 'pointer', width: '48%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
            <Image src="/document-link.png" alt="" width={24} height={24} style={{ flexShrink: 0, opacity: 1, objectFit: 'contain' }}/>
            <span style={{ fontSize: 13, color: extraFile ? '#3B4FD8' : '#8892a4' }}>
              {uploading === 'extra'
            ? 'Uploading…'
            : extraFile
                ? extraFile.split('/').pop()
                : 'Add'}
            </span>
            {extraFile ? (<button type="button" aria-label="Delete additional documents" onClick={(e) => {
            e.stopPropagation();
            setExtraFile('');
            setExtraViewUrl(null);
        }} style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            background: 'transparent',
            border: 'none',
            color: '#dc2626',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
        }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M6 7l1 14h10l1-14M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>) : null}
          </div>
        </div>
        <p style={documentFormatHint}>Accepted formats: PDF, DOC, DOCX.</p>
        <input ref={extraRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            setUploading('extra');
            try {
                const result = await uploadFile(file, 'locum/extra');
                setExtraFile(result.path);
                setExtraViewUrl(result.signedUrl);
            }
            catch {
                alert('Upload failed. Try again.');
            }
            finally {
                setUploading(null);
                e.target.value = '';
            }
        }}/>
      </div>

      
      {saved && (<div style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: 6, padding: '10px 14px', marginBottom: 12,
                fontSize: 13, color: '#166534',
            }}>✓ Profile saved successfully.</div>)}

      
      <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 28px',
            background: saving ? '#8892a4' : '#3B4FD8',
            color: '#fff', border: 'none', borderRadius: 6,
            fontSize: 14, fontWeight: 500,
            cursor: saving ? 'default' : 'pointer',
        }}>
        {saving ? 'Saving…' : 'Done'}
      </button>
    </DashLayout>);
}
