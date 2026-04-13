'use client';

import { useState } from 'react';
import DashLayout, { NavIcon } from '@/components/DashLayout';
import { useAuth } from '@/providers/AuthProvider';

const HOST_NAV = [
  { label:'My Postings', href:'/host/dashboard', icon:<NavIcon name="postings"  /> },
  { label:'Profile',     href:'/host/profile',   icon:<NavIcon name="profile"   /> },
  { label:'Messages',    href:'/host/messages',  icon:<NavIcon name="messages"  /> },
  { label:'Resources',   href:'/host/resources', icon:<NavIcon name="resources" /> },
];
const LOCUM_NAV = [
  { label:'Browse Opportunities', href:'/locum/browse',    icon:<NavIcon name="browse"   /> },
  { label:'My Applications',      href:'/locum/dashboard', icon:<NavIcon name="postings" /> },
  { label:'Profile',              href:'/locum/profile',   icon:<NavIcon name="profile"  /> },
  { label:'Messages',             href:'/locum/messages',  icon:<NavIcon name="messages" /> },
  { label:'Resources',            href:'/locum/resources', icon:<NavIcon name="resources"/> },
];

interface Thread {
  id:     number;
  name:   string;
  role:   string;
  date:   string;
  last:   string;
  job:    string;
  unread: number;
  specs:  string[];
  city:   string;
  msgs:   { from:'me'|'them'; text:string; time:string }[];
}

const THREADS: Thread[] = [
  {
    id:1, name:'Dr Cristiano Jr', role:'CCFP', date:'Mar 2',
    last:'Rahul: My Last Message through the',
    job:'Family Physician Locum – Rural...', unread:0,
    specs:['Specialization 1','Specialization 2','Specialization 3'],
    city:'City, Province',
    msgs:[
      { from:'them', text:'My Last Message Through This Platform. I Have Been Interested In Taking This Opportunity By Giving My Name For This', time:'7:41 PM' },
      { from:'me',   text:'My Last Message Through This Platform. I Have Been Interested In Taking This Opportunity By Giving My Name For This', time:'7:41 PM' },
      { from:'them', text:'My Last Message Through This Platform. I Have Been Interested In Taking This Opportunity By Giving My Name For This', time:'7:41 PM' },
      { from:'me',   text:'My Last Message Through This Platform. I Have Been Interested In Taking This Opportunity By Giving My Name For This', time:'7:41 PM' },
    ],
  },
  {
    id:2, name:'Rahul Mathew', role:'GP', date:'Mar 2',
    last:'Rahul: My Last Message through the',
    job:'Family Physician Locum – Rural...', unread:0,
    specs:['Specialization 1','Specialization 2'],
    city:'City, Province',
    msgs:[
      { from:'them', text:"Hi, I'm interested in the position.", time:'7:00 PM' },
      { from:'me',   text:'Thanks! Please share your availability.', time:'7:05 PM' },
    ],
  },
  {
    id:3, name:'Rahul Mathew', role:'GP', date:'Feb 23',
    last:'Rahul: My Last Message through the',
    job:'Family Physician Locum – Rural...', unread:3,
    specs:['Specialization 1'],
    city:'City, Province',
    msgs:[{ from:'them', text:'Following up on my earlier message.', time:'10:00 AM' }],
  },
  {
    id:4, name:'Rahul Mathew', role:'GP', date:'Mar 2',
    last:'Rahul: My Last Message through the',
    job:'Family Physician Locum – Rural...', unread:0,
    specs:['Specialization 1'],
    city:'City, Province',
    msgs:[{ from:'them', text:'Hello, available this weekend.', time:'9:00 AM' }],
  },
];

export default function MessagesPage({ isHost = false }: { isHost?: boolean }) {
  const { role } = useAuth();
  const nav      = (role === 'clinic' || isHost) ? HOST_NAV : LOCUM_NAV;
  const activeHref = (role === 'clinic' || isHost) ? '/host/messages' : '/locum/messages';

  const [activeThread, setActiveThread] = useState(THREADS[0]);
  const [draft, setDraft] = useState('');
  const [threads, setThreads] = useState(THREADS);

  function sendMessage() {
    if (!draft.trim()) return;
    setThreads(prev => prev.map(t =>
      t.id === activeThread.id
        ? { ...t, msgs: [...t.msgs, { from:'me' as const, text:draft.trim(), time:'Now' }] }
        : t,
    ));
    setActiveThread(prev => ({
      ...prev,
      msgs: [...prev.msgs, { from:'me' as const, text:draft.trim(), time:'Now' }],
    }));
    setDraft('');
  }

  return (
    <DashLayout navItems={nav} activeHref={activeHref}>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#0f1523', marginBottom:3 }}>Messaging</h1>
      <p style={{ fontSize:12, color:'#8892a4', marginBottom:16 }}>
        Define And Manage Organizational, Hierarchy, Departments, And Relationships With AI-Powered Insights
      </p>

      <div style={{
        display:'flex', border:'1px solid #e2e5ee', borderRadius:8,
        overflow:'hidden', background:'#fff', height:'calc(100vh - 230px)', minHeight:400,
      }}>
        {/* Thread list */}
        <div style={{ width:240, flexShrink:0, borderRight:'1px solid #e2e5ee', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #e2e5ee' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:7,
              background:'#F1F3F7', borderRadius:6, padding:'7px 10px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8892a4" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search message" style={{ background:'none', border:'none', outline:'none', fontSize:12, color:'#374151', width:'100%', fontFamily:'inherit' }}/>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {threads.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveThread(t)}
                style={{
                  padding:'12px 14px', borderBottom:'1px solid #f3f4f6',
                  cursor:'pointer',
                  background: activeThread.id===t.id ? '#eef0fb' : '#fff',
                  transition:'background .1s',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'#eef0fb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>⚙️</div>
                    <span style={{ fontSize:13, fontWeight:500, color:'#0f1523' }}>{t.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:11, color:'#8892a4' }}>{t.date}</span>
                    {t.unread>0 && (
                      <span style={{ width:16, height:16, borderRadius:'50%', background:'#3B4FD8', color:'#fff', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>{t.unread}</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize:11, color:'#5a6478', marginBottom:3 }}>{t.last}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:10 }}>🏥</span>
                  <span style={{ fontSize:11, color:'#8892a4' }}>{t.job}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {/* Chat header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e5ee', display:'flex', alignItems:'start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:13, color:'#8892a4', marginBottom:2 }}>Dr Jane Doe Clinic</div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:14, fontWeight:600, color:'#0f1523' }}>{activeThread.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B4FD8" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div style={{ fontSize:12, color:'#8892a4' }}>{activeThread.city}</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:5 }}>
                {activeThread.specs.map(s=>(
                  <span key={s} style={{ padding:'2px 9px', borderRadius:20, border:'1px solid #e2e5ee', fontSize:11, color:'#374151' }}>{s}</span>
                ))}
              </div>
            </div>
            <button style={{
              padding:'7px 14px', background:'#3B4FD8', color:'#fff',
              border:'none', borderRadius:6, fontSize:12, cursor:'pointer',
              display:'flex', alignItems:'center', gap:5,
            }}>
              👤 Confirm
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {activeThread.msgs.map((msg, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: msg.from==='me' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize:11, color:'#8892a4', marginBottom:2 }}>
                  {msg.from==='me' ? 'Dr Jane Doe Clinic' : activeThread.name} · {msg.time}
                </div>
                <div style={{ fontSize:12, color:'#374151', lineHeight:1.65, maxWidth:'80%' }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div style={{ borderTop:'1px solid #e2e5ee', padding:'10px 14px' }}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your message here"
              style={{
                width:'100%', height:64, border:'1px solid #e2e5ee', borderRadius:6,
                padding:'8px 10px', fontSize:13, color:'#374151', resize:'none',
                outline:'none', fontFamily:'inherit', marginBottom:8, boxSizing:'border-box',
              }}
            />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:10 }}>
                {['🖼️','📎','😊'].map(e=>(
                  <button key={e} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', padding:2 }}>{e}</button>
                ))}
              </div>
              <button
                onClick={sendMessage}
                style={{ padding:'8px 22px', background:'#3B4FD8', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer' }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashLayout>
  );
}
