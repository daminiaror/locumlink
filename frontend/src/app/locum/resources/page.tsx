'use client';

import DashLayout, { NavIcon } from '@/components/DashLayout';

const NAV = [
  { label: 'Browse Opportunities', href: '/locum/browse', icon: <NavIcon name="browse" /> },
  { label: 'My Applications', href: '/locum/dashboard', icon: <NavIcon name="postings" /> },
  { label: 'Profile', href: '/locum/profile', icon: <NavIcon name="profile" /> },
  { label: 'Messages', href: '/locum/messages', icon: <NavIcon name="messages" /> },
  { label: 'Resources', href: '/locum/resources', icon: <NavIcon name="resources" /> },
];

export default function LocumResourcesPage() {
  return (
    <DashLayout navItems={NAV} activeHref="/locum/resources">
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Resources</h1>
        <p style={{ color: '#64748b' }}>Resource content will appear here.</p>
      </div>
    </DashLayout>
  );
}
