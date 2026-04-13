'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashLayout, { NavIcon } from '@/components/DashLayout';

const NAV = [
  { label:'Browse Opportunities', href:'/locum/browse',    icon:<NavIcon name="browse"   /> },
  { label:'My Applications',      href:'/locum/dashboard', icon:<NavIcon name="postings" /> },
  { label:'Profile',              href:'/locum/profile',   icon:<NavIcon name="profile"  /> },
  { label:'Messages',             href:'/locum/messages',  icon:<NavIcon name="messages" /> },
  { label:'Resources',            href:'/locum/resources', icon:<NavIcon name="resources"/> },
];

interface Job {
  id:         number;
  title:      string;
  clinic:     string;
  city:       string;
  province:   string;
  start:      string;
  end:        string;
  startTime:  string;
  endTime:    string;
  rate:       string;
  daysAgo:    number;
  applicants: number;
  about:      string;
  specs:      string[];
  experience: string;
  location:   string;
  practice:   string;
  emr:        string;
  amenities:  string[];
  responsibilities: string[];
}

const JOBS: Job[] = [
  {
    id:1, title:'Family Physician Locum – Rural Primary Care Clinic',
    clinic:'Dr Jane Doe Clinic', city:'Hammonds Plains', province:'Nova Scotia',
    start:'Feb 26, 2026', end:'Mar 30, 2026', startTime:'05:00 AM', endTime:'02:00 PM',
    rate:'$2000/day', daysAgo:2, applicants:22,
    about:'Busy, Team Based Family Practice Serving A Mixed Rural Population. We\'re Seeking A Reliable Locum To Provide Full Scope Primary Care (In Person) With Strong Nursing capabilities and commitment to rural healthcare.',
    specs:['Specialization 1','Specialization 2','Specialization 2'],
    experience:'2+ Years',
    location:'26 Cypress Crt, Hammonds Plains, Nova Scotia',
    practice:'Family practice', emr:'med Access',
    amenities:['On-Site Parking','Digital X-Ray','Pharmacy Nearby','Private Office Space','IT Support'],
    responsibilities:[
      'Define and manage organizational hierarchy, departments, and relationships with AI-powered insights.',
      'Define and manage organizational, hierarchy, departments',
      'Define and manage organizational, hierarchy, departments, and relationships with AI-powered insights.',
    ],
  },
  {
    id:2, title:'GP Coverage – Halifax Downtown',
    clinic:'Halifax Medical Centre', city:'Halifax', province:'Nova Scotia',
    start:'Apr 1, 2026', end:'Apr 15, 2026', startTime:'08:00 AM', endTime:'04:00 PM',
    rate:'$1800/day', daysAgo:3, applicants:14,
    about:'Downtown Halifax medical centre seeking experienced GP for 2-week coverage.',
    specs:['General Practice','Emergency Medicine'],
    experience:'3+ Years',
    location:'100 Main St, Halifax, Nova Scotia',
    practice:'General practice', emr:'OSCAR',
    amenities:['Onsite Parking','Cafeteria','IT Support'],
    responsibilities:['Full scope primary care','Manage patient files','EMR documentation'],
  },
  {
    id:3, title:'Urgent: ER Locum – Truro Hospital',
    clinic:'Truro Regional Hospital', city:'Truro', province:'Nova Scotia',
    start:'Mar 20, 2026', end:'Apr 10, 2026', startTime:'19:00 PM', endTime:'07:00 AM',
    rate:'$2500/day', daysAgo:1, applicants:5,
    about:'Urgent need for Emergency Room physician in Truro.',
    specs:['Emergency Medicine','ACLS'],
    experience:'5+ Years',
    location:'875 Abenaki Rd, Truro, Nova Scotia',
    practice:'Hospital', emr:'Meditech',
    amenities:['On-call room','Cafeteria'],
    responsibilities:['Emergency triage','Critical care','Team leadership'],
  },
  {
    id:4, title:'Walk-in Clinic Coverage – Dartmouth',
    clinic:'Dartmouth Walk-in Clinic', city:'Dartmouth', province:'Nova Scotia',
    start:'Apr 5, 2026', end:'Apr 20, 2026', startTime:'09:00 AM', endTime:'05:00 PM',
    rate:'$1600/day', daysAgo:4, applicants:18,
    about:'High-volume walk-in clinic in Dartmouth seeking coverage.',
    specs:['General Practice'],
    experience:'1+ Years',
    location:'44 Portland St, Dartmouth, Nova Scotia',
    practice:'Walk-in', emr:'OSCAR',
    amenities:['Parking','IT Support'],
    responsibilities:['Walk-in assessments','Prescription management'],
  },
  {
    id:5, title:'Pediatrics Locum – IWK Health',
    clinic:'IWK Health Centre', city:'Halifax', province:'Nova Scotia',
    start:'May 1, 2026', end:'May 31, 2026', startTime:'07:00 AM', endTime:'03:00 PM',
    rate:'$2200/day', daysAgo:6, applicants:9,
    about:'IWK Health seeking pediatrician for 1-month coverage.',
    specs:['Paediatrics','CPSC'],
    experience:'3+ Years',
    location:'5980 University Ave, Halifax, Nova Scotia',
    practice:'Pediatric hospital', emr:'Epic',
    amenities:['Parking','Gym','Cafeteria','IT Support'],
    responsibilities:['Pediatric inpatient care','Consultation','Rounds'],
  },
];

export default function LocumBrowsePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(JOBS[0].id);
  const [filterTab,  setFilterTab]  = useState<'all'|'location'|'date'>('all');
  const [applied,    setApplied]    = useState<number[]>([]);

  const job = JOBS.find(j => j.id === selectedId)!;

  return (
    <DashLayout navItems={NAV} activeHref="/locum/browse">
      <h1 style={{ fontSize:20, fontWeight:700, color:'#0f1523', marginBottom:3 }}>
        Welcome Dr John Doe
      </h1>
      <p style={{ fontSize:12, color:'#8892a4', marginBottom:14 }}>
        Define and manage organizational, hierarchy, departments, and relationships with AI-powered insights
      </p>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:12 }}>
        {(['all','location','date'] as const).map((t, i) => (
          <button key={t} onClick={() => setFilterTab(t)} style={{
            padding:'7px 14px', border:`1px solid ${filterTab===t ? '#0f1523' : '#e2e5ee'}`,
            borderRadius:'6px 6px 0 0', background: filterTab===t ? '#fff' : '#F1F3F7',
            fontSize:12, fontWeight: filterTab===t ? 600 : 400,
            color: filterTab===t ? '#0f1523' : '#8892a4',
            cursor:'pointer', fontFamily:'inherit',
          }}>
            {t === 'all' ? `All (${JOBS.length})` : t === 'location' ? `By Location (${JOBS.length})` : `By Date (${JOBS.length})`}
          </button>
        ))}
      </div>

      {/* Split panel */}
      <div style={{
        display:'flex', border:'1px solid #e2e5ee', borderRadius:8,
        overflow:'hidden', background:'#fff',
        maxHeight:'calc(100vh - 280px)',
      }}>
        {/* ── Left: job list ── */}
        <div style={{
          width:250, flexShrink:0,
          borderRight:'1px solid #e2e5ee',
          overflowY:'auto',
        }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid #e2e5ee' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#0f1523', marginBottom:2 }}>Top Picks for you</div>
            <div style={{ fontSize:11, color:'#8892a4' }}>Based on your profile and location</div>
          </div>

          {JOBS.map(j => (
            <div
              key={j.id}
              onClick={() => setSelectedId(j.id)}
              style={{
                padding:'12px 14px', borderBottom:'1px solid #f3f4f6',
                cursor:'pointer', transition:'background .1s',
                background: selectedId===j.id ? '#eef0fb' : '#fff',
                position:'relative',
              }}
            >
              {selectedId===j.id && (
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'#3B4FD8' }}/>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:12, fontWeight:600, color:'#3B4FD8', lineHeight:1.3 }}>
                  {j.title.length>38 ? j.title.slice(0,38)+'…' : j.title}
                </span>
                <span style={{ fontSize:11, color:'#8892a4', flexShrink:0, marginLeft:6 }}>Mar {j.id}</span>
              </div>
              <div style={{ fontSize:11, color:'#5a6478', marginBottom:4 }}>{j.city}, {j.province}</div>
              <div style={{ fontSize:11, color:'#8892a4' }}>📅 {j.start} – {j.end}</div>
            </div>
          ))}
        </div>

        {/* ── Right: detail ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
          <div style={{ fontSize:12, color:'#3B4FD8', marginBottom:3 }}>
            {job.clinic} ✓
          </div>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#0f1523', marginBottom:4 }}>{job.title}</h2>
          <p style={{ fontSize:12, color:'#5a6478', marginBottom:12 }}>
            {job.city}, {job.province} · {job.daysAgo} days ago · Over {job.applicants} applicants
          </p>

          {/* Date/time + rate */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            <span style={{ background:'#F1F3F7', padding:'5px 10px', borderRadius:5, fontSize:12, color:'#5a6478' }}>
              📅 {job.start} – {job.end}
            </span>
            <span style={{ background:'#F1F3F7', padding:'5px 10px', borderRadius:5, fontSize:12, color:'#5a6478' }}>
              🕐 {job.startTime} – {job.endTime}
            </span>
            <span style={{ background:'#F0FDF4', padding:'5px 10px', borderRadius:5, fontSize:12, color:'#166534', fontWeight:600 }}>
              {job.rate}
            </span>
          </div>

          {/* Apply button */}
          <button
            onClick={() => setApplied(a => a.includes(job.id) ? a : [...a, job.id])}
            style={{
              padding:'9px 22px', border:'none', borderRadius:6,
              fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:18,
              background: applied.includes(job.id) ? '#d0d4e4' : '#3B4FD8',
              color: applied.includes(job.id) ? '#5a6478' : '#fff',
              transition:'background .2s',
            }}
          >
            {applied.includes(job.id) ? '✓ Applied' : 'Apply ›'}
          </button>

          {/* About */}
          <h4 style={{ fontSize:13, fontWeight:600, color:'#0f1523', marginBottom:6 }}>About the Job</h4>
          <p style={{ fontSize:12, color:'#5a6478', lineHeight:1.7, marginBottom:14 }}>{job.about}</p>

          {/* Requirements */}
          <h4 style={{ fontSize:13, fontWeight:600, color:'#0f1523', marginBottom:8 }}>Requirements</h4>
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'#374151', marginBottom:5 }}>Required Specialization</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {job.specs.map(s=>(
                <span key={s} style={{ padding:'3px 10px', borderRadius:20, border:'1px solid #e2e5ee', fontSize:12, color:'#374151' }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 }}>Preferred Experience</div>
            <div style={{ fontSize:12, color:'#5a6478' }}>{job.experience}</div>
          </div>

          {/* Key responsibilities */}
          <h4 style={{ fontSize:13, fontWeight:600, color:'#0f1523', marginBottom:6 }}>Key Responsibilities</h4>
          <ul style={{ paddingLeft:16, marginBottom:14 }}>
            {job.responsibilities.map((r,i)=>(
              <li key={i} style={{ fontSize:12, color:'#5a6478', lineHeight:1.7, marginBottom:3 }}>{r}</li>
            ))}
          </ul>

          {/* About the clinic */}
          <h4 style={{ fontSize:13, fontWeight:600, color:'#0f1523', marginBottom:8 }}>
            About {job.clinic}
          </h4>
          <div style={{ fontSize:12, color:'#5a6478', lineHeight:1.8, marginBottom:12 }}>
            <strong style={{ color:'#374151' }}>Location:</strong> {job.location}<br/>
            <strong style={{ color:'#374151' }}>Practice Type:</strong> {job.practice}<br/>
            <strong style={{ color:'#374151' }}>EMR System:</strong> {job.emr}
          </div>

          {/* Amenities */}
          <h4 style={{ fontSize:13, fontWeight:600, color:'#0f1523', marginBottom:7 }}>Amenities</h4>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:18 }}>
            {job.amenities.map(a=>(
              <span key={a} style={{ padding:'4px 10px', borderRadius:20, border:'1px solid #e2e5ee', fontSize:12, color:'#374151' }}>{a}</span>
            ))}
          </div>

          {/* Second apply */}
          <button
            onClick={() => setApplied(a => a.includes(job.id) ? a : [...a, job.id])}
            style={{
              padding:'9px 22px', border:'none', borderRadius:6,
              fontSize:14, fontWeight:600, cursor:'pointer',
              background: applied.includes(job.id) ? '#d0d4e4' : '#3B4FD8',
              color: applied.includes(job.id) ? '#5a6478' : '#fff',
            }}
          >
            {applied.includes(job.id) ? '✓ Applied' : 'Apply ›'}
          </button>
        </div>
      </div>
    </DashLayout>
  );
}
