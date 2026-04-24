'use client';
import { useEffect, useState, useCallback, useMemo, useRef, type CSSProperties, type KeyboardEvent, type ReactNode, } from 'react';
import Image from 'next/image';
import DashLayout, { NavIcon } from '@/components/DashLayout';
import { locumApi, type BrowseJob } from '@/lib/api';
import { useNextPageClientProps } from '@/lib/use-next-page-client-props';
import type { LocumProfile } from '@/types';
import { isCpsnsVerified } from '@/lib/cpsnsVerify';
import { relativeHoursOrDaysAgo } from '@/lib/relativeTime';
import citiesRaw from '@/data/cities.json';
const NAV = [
    {
        label: 'Browse Opportunities',
        href: '/locum/browse',
        icon: <NavIcon name="browse"/>,
    },
    {
        label: 'My Applications',
        href: '/locum/dashboard',
        icon: <NavIcon name="postings"/>,
    },
    {
        label: 'Profile',
        href: '/locum/profile',
        icon: <NavIcon name="profile"/>,
    },
    {
        label: 'Messages',
        href: '/locum/messages',
        icon: <NavIcon name="messages"/>,
    },
    {
        label: 'Resources',
        href: '/locum/resources',
        icon: <NavIcon name="resources"/>,
    },
];
type CityEntry = {
    name: string;
    province: string;
};
const BROWSE_CITY_ROWS: CityEntry[] = (citiesRaw as [
    string,
    string
][]).map(([name, province]) => ({ name, province }));
const BROWSE_PROVINCE_NAMES: Record<string, string> = {
    AB: 'Alberta',
    BC: 'British Columbia',
    MB: 'Manitoba',
    NB: 'New Brunswick',
    NL: 'Newfoundland & Labrador',
    NS: 'Nova Scotia',
    NT: 'Northwest Territories',
    NU: 'Nunavut',
    ON: 'Ontario',
    PE: 'Prince Edward Island',
    QC: 'Quebec',
    SK: 'Saskatchewan',
    YT: 'Yukon',
};
type BrowseSearchSuggestion = {
    id: string;
    primary: string;
    secondary?: string;
    value: string;
};
const BROWSE_SUGGEST_MAX = 14;
const browseSuggestHighlight: CSSProperties = {
    background: 'rgba(59, 79, 216, 0.15)',
    color: '#1e3a8a',
    borderRadius: 2,
    fontWeight: 700,
};
function highlightBrowseMatch(text: string, query: string): ReactNode {
    const q = query.trim();
    if (!q)
        return text;
    const lower = text.toLowerCase();
    const lq = q.toLowerCase();
    const idx = lower.indexOf(lq);
    if (idx < 0)
        return text;
    return (<>
      {text.slice(0, idx)}
      <mark style={browseSuggestHighlight}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>);
}
function buildBrowseSearchSuggestions(qRaw: string, jobs: BrowseJob[]): BrowseSearchSuggestion[] {
    const qt = qRaw.trim();
    if (!qt)
        return [];
    const q = qt.toLowerCase();
    const out: BrowseSearchSuggestion[] = [];
    const seenValue = new Set<string>();
    const push = (s: BrowseSearchSuggestion) => {
        const k = s.value.trim().toLowerCase();
        if (seenValue.has(k))
            return false;
        seenValue.add(k);
        out.push(s);
        return out.length >= BROWSE_SUGGEST_MAX;
    };
    if (q.length >= 2) {
        let found = BROWSE_CITY_ROWS.filter((c) => c.name.toLowerCase().startsWith(q)).slice(0, 6);
        if (found.length < 3) {
            const keys = new Set(found.map((c) => `${c.name}|${c.province}`));
            const extra = BROWSE_CITY_ROWS.filter((c) => !keys.has(`${c.name}|${c.province}`) &&
                c.name.toLowerCase().includes(q)).slice(0, 6 - found.length);
            found = [...found, ...extra];
        }
        for (const c of found) {
            if (push({
                id: `cat-${c.name}-${c.province}`,
                primary: c.name,
                secondary: c.province,
                value: c.name,
            }))
                return out;
        }
    }
    if (q.length >= 2) {
        for (const [code, name] of Object.entries(BROWSE_PROVINCE_NAMES)) {
            if (out.length >= BROWSE_SUGGEST_MAX)
                break;
            if (code.toLowerCase().includes(q) || name.toLowerCase().includes(q)) {
                push({
                    id: `prov-${code}`,
                    primary: name,
                    secondary: code,
                    value: code,
                });
            }
        }
    }
    const seenHostCity = new Set<string>();
    for (const j of jobs) {
        if (out.length >= BROWSE_SUGGEST_MAX)
            break;
        const city = (j.hostProfile.city ?? '').trim();
        const prov = (j.hostProfile.province ?? '').trim();
        if (!city)
            continue;
        const ck = `${city}|${prov}`;
        if (seenHostCity.has(ck))
            continue;
        const cityL = city.toLowerCase();
        const provL = prov.toLowerCase();
        const provName = prov ? (BROWSE_PROVINCE_NAMES[prov] ?? prov) : '';
        if (cityL.includes(q) ||
            provL.includes(q) ||
            (provName && provName.toLowerCase().includes(q))) {
            seenHostCity.add(ck);
            push({
                id: `jobloc-${ck}`,
                primary: city,
                secondary: prov || provName || undefined,
                value: city,
            });
        }
    }
    for (const j of jobs) {
        if (out.length >= BROWSE_SUGGEST_MAX)
            break;
        const t = j.title;
        if (!t.toLowerCase().includes(q))
            continue;
        const sub = [j.hostProfile.city, j.hostProfile.province]
            .filter(Boolean)
            .join(', ');
        push({
            id: `title-${j.id}`,
            primary: t,
            secondary: sub || undefined,
            value: t,
        });
    }
    return out;
}
function fmtDate(iso: string | null): string {
    if (!iso)
        return '';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
}
function fmtTime(t: string | null): string {
    if (!t)
        return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}
function daysAgo(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function normLoc(s: string | null | undefined): string {
    return (s ?? '').trim().toLowerCase();
}
function postalFSA(pc: string | null | undefined): string {
    const raw = (pc ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (raw.length < 3)
        return '';
    return raw.slice(0, 3);
}
function postalCloseness(locumPostal: string | null | undefined, hostPostal: string | null | undefined): number {
    const a = postalFSA(locumPostal);
    const b = postalFSA(hostPostal);
    if (!a || !b)
        return 2;
    if (a === b)
        return 0;
    if (a.slice(0, 2) === b.slice(0, 2))
        return 1;
    return 2;
}
function browseLocationProximityKey(locum: LocumProfile | null, j: BrowseJob): [
    number,
    number,
    string,
    string
] {
    const hc = normLoc(j.hostProfile.city);
    const hp = normLoc(j.hostProfile.province);
    const practice = (j.hostProfile.practiceName ?? '').toLowerCase();
    if (!locum)
        return [3, 3, hc, practice];
    const lc = normLoc(locum.city);
    const lp = normLoc(locum.province);
    if (!lc || !lp)
        return [3, 3, hc, practice];
    const pc = postalCloseness(locum.postalCode, j.hostProfile.postalCode);
    if (hc && hp && lc === hc && lp === hp)
        return [0, pc, hc, practice];
    if (hp && lp === hp)
        return [1, pc, hc, practice];
    return [2, 2, hp, hc];
}
function compareBrowseLocationProximity(locum: LocumProfile | null, a: BrowseJob, b: BrowseJob): number {
    const ka = browseLocationProximityKey(locum, a);
    const kb = browseLocationProximityKey(locum, b);
    for (let i = 0; i < ka.length; i++) {
        const va = ka[i];
        const vb = kb[i];
        if (va < vb)
            return -1;
        if (va > vb)
            return 1;
    }
    return a.title.localeCompare(b.title);
}
export default function LocumBrowsePage(props: {
    params?: Promise<Record<string, string | string[] | undefined>>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    useNextPageClientProps(props);
    const [jobs, setJobs] = useState<BrowseJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filterTab, setFilterTab] = useState<'all' | 'location' | 'date'>('all');
    const [locationSearch, setLocationSearch] = useState('');
    const [searchDropOpen, setSearchDropOpen] = useState(false);
    const [searchActiveIdx, setSearchActiveIdx] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchDropRef = useRef<HTMLDivElement>(null);
    const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchActiveIdxRef = useRef(-1);
    const browseSearchSuggestions = useMemo(() => buildBrowseSearchSuggestions(locationSearch, jobs), [locationSearch, jobs]);
    const applyBrowseSearchSuggestion = useCallback((s: BrowseSearchSuggestion) => {
        setLocationSearch(s.value);
        setSearchDropOpen(false);
        setSearchActiveIdx(-1);
    }, []);
    const handleBrowseSearchKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (!searchDropOpen || browseSearchSuggestions.length === 0) {
            if (e.key === 'Escape')
                setSearchDropOpen(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSearchActiveIdx((i) => {
                const n = browseSearchSuggestions.length;
                if (n === 0)
                    return -1;
                if (i < 0)
                    return 0;
                return Math.min(i + 1, n - 1);
            });
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSearchActiveIdx((i) => (i <= 0 ? -1 : i - 1));
        }
        else if (e.key === 'Enter') {
            const idx = searchActiveIdxRef.current;
            const picked = idx >= 0 ? browseSearchSuggestions[idx] : undefined;
            if (picked) {
                e.preventDefault();
                applyBrowseSearchSuggestion(picked);
            }
        }
        else if (e.key === 'Escape') {
            setSearchDropOpen(false);
        }
    }, [searchDropOpen, browseSearchSuggestions, applyBrowseSearchSuggestion]);
    useEffect(() => {
        setSearchActiveIdx(-1);
    }, [locationSearch]);
    useEffect(() => {
        searchActiveIdxRef.current = searchActiveIdx;
    }, [searchActiveIdx]);
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            const t = e.target as Node;
            if (searchDropRef.current?.contains(t) ||
                searchInputRef.current?.contains(t)) {
                return;
            }
            setSearchDropOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);
    useEffect(() => () => {
        if (searchBlurTimer.current != null)
            clearTimeout(searchBlurTimer.current);
    }, []);
    const [applied, setApplied] = useState<Set<string>>(new Set());
    const [applying, setApplying] = useState<string | null>(null);
    const [applyError, setApplyError] = useState('');
    const [profile, setProfile] = useState<LocumProfile | null>(null);
    const loadJobs = useCallback(async () => {
        setLoading(true);
        try {
            const { jobs: data } = await locumApi.browseJobs();
            setJobs(data);
            if (data.length > 0)
                setSelectedId(data[0].id);
        }
        catch {
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadJobs();
    }, [loadJobs]);
    useEffect(() => {
        locumApi
            .getProfile()
            .then((data) => {
            if (data.exists && data.profile)
                setProfile(data.profile);
        })
            .catch(() => { });
    }, []);
    useEffect(() => {
        locumApi
            .getMyApplications()
            .then(({ applications }) => {
            const ids = new Set(applications.map((a: {
                jobPosting: {
                    id: string;
                };
            }) => a.jobPosting.id));
            setApplied(ids);
        })
            .catch(() => { });
    }, []);
    const filteredJobs = useMemo(() => {
        let result = [...jobs];
        if (locationSearch.trim()) {
            const q = locationSearch.trim().toLowerCase();
            const isMatch = (j: BrowseJob): boolean => {
                const city = (j.hostProfile.city ?? '').toLowerCase();
                const prov = (j.hostProfile.province ?? '').toLowerCase();
                const loc = (j.location ?? '').toLowerCase();
                const title = (j.title ?? '').toLowerCase();
                return (city.includes(q) ||
                    prov.includes(q) ||
                    loc.includes(q) ||
                    title.includes(q));
            };
            const matchRank = (j: BrowseJob): number => {
                const city = (j.hostProfile.city ?? '').toLowerCase();
                const prov = (j.hostProfile.province ?? '').toLowerCase();
                const loc = (j.location ?? '').toLowerCase();
                const title = (j.title ?? '').toLowerCase();
                if (city.startsWith(q))
                    return 0;
                if (prov.startsWith(q))
                    return 1;
                if (city.includes(q))
                    return 2;
                if (prov.includes(q))
                    return 3;
                if (loc.includes(q))
                    return 4;
                if (title.includes(q))
                    return 5;
                return 6;
            };
            const toCreatedAtMs = (j: BrowseJob): number => {
                if (!j.createdAt)
                    return 0;
                const t = new Date(j.createdAt).getTime();
                return Number.isNaN(t) ? 0 : t;
            };
            const matches: BrowseJob[] = [];
            const rest: BrowseJob[] = [];
            for (const j of result) {
                (isMatch(j) ? matches : rest).push(j);
            }
            matches.sort((a, b) => {
                const ra = matchRank(a);
                const rb = matchRank(b);
                if (ra !== rb)
                    return ra - rb;
                return toCreatedAtMs(b) - toCreatedAtMs(a);
            });
            rest.sort((a, b) => toCreatedAtMs(b) - toCreatedAtMs(a));
            result = [...matches, ...rest];
        }
        if (filterTab === 'location') {
            if (profile?.city?.trim() && profile?.province?.trim()) {
                result = [...result].sort((a, b) => compareBrowseLocationProximity(profile, a, b));
            }
            else {
                result = [...result].sort((a, b) => (a.hostProfile.city ?? '').localeCompare(b.hostProfile.city ?? ''));
            }
        }
        else if (filterTab === 'date') {
            result = [...result].sort((a, b) => {
                const ca = a.createdAt ? new Date(a.createdAt).getTime() : null;
                const cb = b.createdAt ? new Date(b.createdAt).getTime() : null;
                if (ca !== null || cb !== null) {
                    if (ca === null && cb === null)
                        return 0;
                    if (ca === null)
                        return 1;
                    if (cb === null)
                        return -1;
                    if (cb !== ca)
                        return cb - ca;
                }
                const ta = a.startDate ? new Date(a.startDate).getTime() : null;
                const tb = b.startDate ? new Date(b.startDate).getTime() : null;
                if (ta === null && tb === null)
                    return 0;
                if (ta === null)
                    return 1;
                if (tb === null)
                    return -1;
                return tb - ta;
            });
        }
        return result;
    }, [jobs, filterTab, locationSearch, profile]);
    useEffect(() => {
        if (filteredJobs.length > 0 &&
            !filteredJobs.find((j) => j.id === selectedId)) {
            setSelectedId(filteredJobs[0].id);
        }
    }, [filteredJobs, selectedId]);
    const job = filteredJobs.find((j) => j.id === selectedId) ?? null;
    const canApply = isCpsnsVerified(profile?.cpsnsNumber);
    async function handleApply(jobId: string) {
        if (applied.has(jobId))
            return;
        if (!canApply) {
            setApplyError('Your CPSNS number must be verified before you can apply. Complete your profile and use a CPSNS on the verified list.');
            return;
        }
        setApplying(jobId);
        setApplyError('');
        try {
            await locumApi.applyToJob(jobId);
            setApplied((prev) => new Set([...prev, jobId]));
        }
        catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to apply. Please try again.';
            if (msg.toLowerCase().includes('already')) {
                setApplied((prev) => new Set([...prev, jobId]));
            }
            else {
                setApplyError(msg);
            }
        }
        finally {
            setApplying(null);
        }
    }
    const isApplied = (id: string) => applied.has(id);
    const isApplying = (id: string) => applying === id;
    const applyDisabled = (id: string) => !canApply || isApplied(id) || isApplying(id);
    const displayName = profile?.firstName
        ? `Dr ${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ''}`
        : 'Doctor';
    return (<DashLayout navItems={NAV} activeHref="/locum/browse" topbarFirstName={profile?.firstName} topbarLastName={profile?.lastName}>
      <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
        }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0f1523',
            marginBottom: 3,
        }}>
            Welcome {displayName}
          </h1>
          <p style={{ fontSize: 12, color: '#8892a4', marginBottom: 14 }}></p>

          {!canApply && profile && (<div style={{
                marginBottom: 14,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #FDE68A',
                background: '#FFFBEB',
                fontSize: 12,
                color: '#92400E',
                lineHeight: 1.5,
            }}>
              <strong>CPSNS verification required.</strong> Only locums whose
              CPSNS number is on the verified list can apply. Update your CPSNS
              on your{' '}
              <a href="/locum/profile" style={{ color: '#1d4ed8', fontWeight: 600 }}>
                profile
              </a>{' '}
              if needed.
            </div>)}

          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
        }}>
            
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'date'] as const).map((t) => {
            const count = t === 'all'
                ? jobs.length
                : jobs.length;
            return (<button key={t} onClick={() => setFilterTab(t)} style={{
                    padding: '7px 14px',
                    border: `1px solid ${filterTab === t ? '#0f1523' : '#e2e5ee'}`,
                    borderRadius: '6px 6px 0 0',
                    background: filterTab === t ? '#fff' : '#F1F3F7',
                    fontSize: 12,
                    fontWeight: filterTab === t ? 600 : 400,
                    color: filterTab === t ? '#0f1523' : '#8892a4',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                }}>
                    {t === 'all'
                    ? `All (${count})`
                    : 'By Date'}
                  </button>);
        })}
            </div>

            
            <div style={{
            position: 'relative',
            display: 'inline-block',
            minWidth: 220,
        }}>
              <input ref={searchInputRef} type="text" value={locationSearch} autoComplete="off" role="combobox" aria-expanded={searchDropOpen} aria-controls="locum-browse-search-listbox" aria-autocomplete="list" onChange={(e) => {
            const v = e.target.value;
            setLocationSearch(v);
            if (searchBlurTimer.current != null) {
                clearTimeout(searchBlurTimer.current);
            }
            const next = buildBrowseSearchSuggestions(v, jobs);
            setSearchDropOpen(next.length > 0);
        }} onKeyDown={handleBrowseSearchKeyDown} placeholder="Search by city, province, or title…" style={{
            height: 34,
            width: '100%',
            boxSizing: 'border-box',
            padding: '4px 10px',
            border: '1px solid #e2e5ee',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
            color: '#0f1523',
            minWidth: 220,
        }} onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3B4FD8';
            if (searchBlurTimer.current != null) {
                clearTimeout(searchBlurTimer.current);
            }
            const next = buildBrowseSearchSuggestions(e.target.value, jobs);
            if (next.length)
                setSearchDropOpen(true);
        }} onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e5ee';
            searchBlurTimer.current = setTimeout(() => setSearchDropOpen(false), 170);
        }}/>
              {searchDropOpen && browseSearchSuggestions.length > 0 && (<div id="locum-browse-search-listbox" ref={searchDropRef} role="listbox" style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                zIndex: 300,
                background: '#fff',
                border: '1px solid #e2e5ee',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(15, 21, 35, 0.12)',
                maxHeight: 240,
                overflowY: 'auto',
            }}>
                  {browseSearchSuggestions.map((s, i) => (<div key={s.id} role="option" aria-selected={i === searchActiveIdx} onMouseDown={(ev) => {
                    ev.preventDefault();
                    if (searchBlurTimer.current != null) {
                        clearTimeout(searchBlurTimer.current);
                    }
                    applyBrowseSearchSuggestion(s);
                }} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    borderBottom: '1px solid #f3f4f6',
                    background: i === searchActiveIdx ? '#eef0fb' : 'transparent',
                    color: '#0f1523',
                }}>
                      <span style={{
                    fontWeight: 500,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                        {highlightBrowseMatch(s.primary, locationSearch)}
                      </span>
                      {s.secondary ? (<span style={{
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#3B4FD8',
                        background: 'rgba(59, 79, 216, 0.1)',
                        padding: '2px 6px',
                        borderRadius: 4,
                    }}>
                          {s.secondary}
                        </span>) : null}
                    </div>))}
                </div>)}
            </div>

            {locationSearch && (<button type="button" onClick={() => {
                setLocationSearch('');
                setSearchDropOpen(false);
            }} style={{
                padding: '4px 8px',
                border: 'none',
                background: 'none',
                color: '#8892a4',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
            }}>
                ✕ Clear
              </button>)}

            
            {(locationSearch || filterTab !== 'all') && (<span style={{ fontSize: 11, color: '#8892a4' }}>
                Showing {filteredJobs.length} of {jobs.length}
              </span>)}
          </div>
        </div>

        
        <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            border: '1px solid #e2e5ee',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff',
        }}>
          
          <div style={{
            width: 290,
            flexShrink: 0,
            minHeight: 0,
            borderRight: '1px solid #e2e5ee',
            overflowY: 'auto',
        }}>
            <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid #e2e5ee',
        }}>
              <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#0f1523',
            marginBottom: 2,
        }}>
                {filterTab === 'all'
            ? 'Top Picks for you'
            : 'Most Recent'}
              </div>
              <div style={{ fontSize: 11, color: '#8892a4' }}>
                Based on your profile and location
              </div>
            </div>

            {loading && (<div style={{
                padding: '24px',
                textAlign: 'center',
                fontSize: 12,
                color: '#8892a4',
            }}>
                Loading jobs…
              </div>)}

            {!loading && filteredJobs.length === 0 && (<div style={{
                padding: '24px',
                textAlign: 'center',
                fontSize: 12,
                color: '#8892a4',
            }}>
                {locationSearch
                ? `No jobs matching "${locationSearch}".`
                : 'No jobs available right now.'}
              </div>)}

            {!loading &&
            filteredJobs.map((j) => (<div key={j.id} onClick={() => setSelectedId(j.id)} style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: selectedId === j.id ? '#eef0fb' : '#fff',
                    position: 'relative',
                }}>
                  {selectedId === j.id && (<div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: '#3B4FD8',
                    }}/>)}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 3,
                }}>
                    <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: '140%',
                    color: 'var(--brand-primary)',
                }}>
                      {j.title.length > 38
                    ? j.title.slice(0, 38) + '…'
                    : j.title}
                    </span>
                    <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    fontWeight: 400,
                    lineHeight: '140%',
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                    marginLeft: 6,
                }}>
                      {daysAgo(j.createdAt)}d ago
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    fontWeight: 400,
                    lineHeight: '150%',
                    color: 'var(--text-muted)',
                    textTransform: 'capitalize',
                    marginBottom: 4,
                }}>
                    {j.hostProfile.city}, {j.hostProfile.province}
                  </div>
                  {(j.startDate || j.endDate) && (<div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        fontWeight: 500,
                        lineHeight: '140%',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                      <Image src="/calender.png" alt="" width={12} height={12} style={{ flexShrink: 0, objectFit: 'contain' }}/>
                      {fmtDate(j.startDate)} – {fmtDate(j.endDate)}
                    </div>)}
                  
                  {isApplied(j.id) && (<span style={{
                        display: 'inline-block',
                        marginTop: 4,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: '#d1fae5',
                        color: '#065f46',
                        fontSize: 10,
                        fontWeight: 600,
                    }}>
                      ✓ Applied
                    </span>)}
                </div>))}
          </div>

          
          {job ? (<div style={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
              <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '18px 20px',
            }}>
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 3,
            }}>
                  <span style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontStyle: 'normal',
                fontSize: 18,
                lineHeight: '100%',
                letterSpacing: 0,
                verticalAlign: 'middle',
                color: '#0f1523',
                leadingTrim: 'none',
            } as CSSProperties}>
                    {job.hostProfile.practiceName}
                  </span>
                  <Image src="/clinic-verified.png" alt="" width={18} height={18} style={{
                flexShrink: 0,
                objectFit: 'contain',
                verticalAlign: 'middle',
            }}/>
                </div>
                <h2 style={{
                fontSize: 17,
                fontWeight: 700,
                color: '#0f1523',
                marginBottom: 4,
            }}>
                  {job.title}
                </h2>
                <p style={{ fontSize: 12, color: '#5a6478', marginBottom: 12 }}>
                  {job.hostProfile.city}, {job.hostProfile.province} ·{' '}
                  {relativeHoursOrDaysAgo(job.createdAt)} ·{' '}
                  {job.applicationsCount} applicant
                  {job.applicationsCount !== 1 ? 's' : ''}
                </p>

                
                <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 14,
            }}>
                  {(job.startDate || job.endDate) && (<span style={{
                    background: '#F1F3F7',
                    padding: '5px 10px',
                    borderRadius: 5,
                    fontSize: 12,
                    color: '#5a6478',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
                      <Image src="/calender.png" alt="" width={14} height={14} style={{ flexShrink: 0, objectFit: 'contain' }}/>
                      {fmtDate(job.startDate)} – {fmtDate(job.endDate)}
                    </span>)}
                  {(job.startTime || job.endTime) && (<span style={{
                    background: '#F1F3F7',
                    padding: '5px 10px',
                    borderRadius: 5,
                    fontSize: 12,
                    color: '#5a6478',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
                      <Image src="/clock.png" alt="" width={14} height={14} style={{ flexShrink: 0, objectFit: 'contain' }}/>
                      {fmtTime(job.startTime)} – {fmtTime(job.endTime)}
                    </span>)}
                  {job.payPerDay && (<span style={{
                    background: '#F0FDF4',
                    padding: '5px 10px',
                    borderRadius: 5,
                    fontSize: 12,
                    color: '#166534',
                    fontWeight: 600,
                }}>
                      ${Number(job.payPerDay).toLocaleString()}/day
                    </span>)}
                  {job.isRural && (<span style={{
                    background: '#FFF7ED',
                    padding: '5px 10px',
                    borderRadius: 5,
                    fontSize: 12,
                    color: '#9a3412',
                }}>
                      🌾 Rural
                    </span>)}
                  {job.accommodationProvided && (<span style={{
                    background: '#EFF6FF',
                    padding: '5px 10px',
                    borderRadius: 5,
                    fontSize: 12,
                    color: '#1e40af',
                }}>
                      🏠 Accommodation
                    </span>)}
                </div>

                
                {job.description?.trim() && (<>
                    <h4 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f1523',
                    marginBottom: 6,
                }}>
                      About the Job
                    </h4>
                    <p style={{
                    fontSize: 12,
                    color: '#5a6478',
                    lineHeight: 1.7,
                    marginBottom: 14,
                    whiteSpace: 'pre-wrap',
                }}>
                      {job.description.trim()}
                    </p>
                  </>)}

                
                {(job.requiredCredentials.length > 0 ||
                job.minYearsExperience) && (<>
                    <h4 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f1523',
                    marginBottom: 8,
                }}>
                      Requirements
                    </h4>
                    {job.requiredCredentials.length > 0 && (<div style={{ marginBottom: 6 }}>
                        <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 5,
                    }}>
                          Required Credentials
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {job.requiredCredentials.map((s) => (<span key={s} style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            border: '1px solid #e2e5ee',
                            fontSize: 12,
                            color: '#374151',
                        }}>
                              {s}
                            </span>))}
                        </div>
                      </div>)}
                    {job.minYearsExperience && (<div style={{ marginBottom: 14 }}>
                        <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 4,
                    }}>
                          Preferred Experience
                        </div>
                        <div style={{ fontSize: 12, color: '#5a6478' }}>
                          {job.minYearsExperience}+ Years
                        </div>
                      </div>)}
                  </>)}

                
                {job.keyResponsibilities.length > 0 && (<>
                    <h4 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f1523',
                    marginBottom: 6,
                }}>
                      Key Responsibilities
                    </h4>
                    <ul style={{ paddingLeft: 16, marginBottom: 14 }}>
                      {job.keyResponsibilities.map((r, i) => (<li key={i} style={{
                        fontSize: 12,
                        color: '#5a6478',
                        lineHeight: 1.7,
                        marginBottom: 3,
                    }}>
                          {r}
                        </li>))}
                    </ul>
                  </>)}

                
                <h4 style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#0f1523',
                marginBottom: 8,
            }}>
                  About {job.hostProfile.practiceName}
                </h4>
                <div style={{
                fontSize: 12,
                color: '#5a6478',
                lineHeight: 1.8,
                marginBottom: 12,
            }}>
                  {job.hostProfile.address && (<>
                      <strong style={{ color: '#374151' }}>Location:</strong>{' '}
                      {job.hostProfile.address}
                      <br />
                    </>)}
                  {job.hostProfile.practiceType && (<>
                      <strong style={{ color: '#374151' }}>
                        Practice Type:
                      </strong>{' '}
                      {job.hostProfile.practiceType}
                      <br />
                    </>)}
                  {job.hostProfile.emr && (<>
                      <strong style={{ color: '#374151' }}>EMR System:</strong>{' '}
                      {job.hostProfile.emr}
                      <br />
                    </>)}
                </div>

                {job.hostProfile.highlights?.trim() && (<>
                    <h4 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f1523',
                    marginBottom: 6,
                }}>
                      Clinic description
                    </h4>
                    <p style={{
                    fontSize: 12,
                    color: '#5a6478',
                    lineHeight: 1.7,
                    marginBottom: 14,
                    whiteSpace: 'pre-wrap',
                }}>
                      {job.hostProfile.highlights.trim()}
                    </p>
                  </>)}

                
                {job.hostProfile.servicesOffered.length > 0 && (<>
                    <h4 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f1523',
                    marginBottom: 7,
                }}>
                      Amenities
                    </h4>
                    <div style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 0,
                }}>
                      {job.hostProfile.servicesOffered.map((a) => (<span key={a} style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        border: '1px solid #e2e5ee',
                        fontSize: 12,
                        color: '#374151',
                    }}>
                          {a}
                        </span>))}
                    </div>
                  </>)}
              </div>

              
              <div style={{
                flexShrink: 0,
                borderTop: '1px solid #e2e5ee',
                padding: '12px 20px 14px',
                background: '#fff',
                boxShadow: '0 -6px 16px rgba(15, 21, 35, 0.06)',
            }}>
                {applyError && (<p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>
                    {applyError}
                  </p>)}
              <button type="button" onClick={() => handleApply(job.id)} disabled={!canApply || isApplying(job.id)} title={!canApply ? 'Verify CPSNS to apply' : undefined} style={{
                height: 34,
                padding: '0 14px',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: !canApply
                    ? 'not-allowed'
                    : isApplying(job.id)
                        ? 'wait'
                        : 'pointer',
                background: !canApply ? '#e5e7eb' : '#3B4FD8',
                color: !canApply ? '#9ca3af' : '#fff',
            }}>
                Apply
              </button>
              </div>
            </div>) : (!loading && (<div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8892a4',
                fontSize: 13,
            }}>
                {filteredJobs.length === 0
                ? 'No jobs match your search.'
                : 'Select a job to view details'}
              </div>))}
        </div>
      </div>
    </DashLayout>);
}
