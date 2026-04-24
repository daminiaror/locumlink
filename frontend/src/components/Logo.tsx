'use client';
import Image from 'next/image';
interface LogoProps {
    white?: boolean;
    size?: 'sm' | 'md' | 'lg';
}
const sizes = { sm: 14, md: 17, lg: 22 };
const imgPx = { sm: 28, md: 32, lg: 36 };
export default function Logo({ white = false, size = 'md' }: LogoProps) {
    const fs = sizes[size];
    const color = white ? '#fff' : '#0f1523';
    const accent = white ? '#fff' : '#3B4FD8';
    const icon = imgPx[size];
    return (<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Image src="/logo.png" alt="" width={icon} height={icon} style={{ objectFit: 'contain', flexShrink: 0 }}/>
      <span style={{
            fontSize: fs,
            fontWeight: 700,
            color,
            fontFamily: 'var(--font-family-display, Outfit, sans-serif)',
        }}>
        Locum <span style={{ color: accent, fontWeight: 400 }}>Link</span>
      </span>
    </div>);
}
