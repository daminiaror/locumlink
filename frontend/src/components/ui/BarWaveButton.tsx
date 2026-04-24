'use client';
import { useState, useCallback, type ReactNode, type CSSProperties, } from 'react';
interface Props {
    onClick: () => Promise<void> | void;
    children: ReactNode;
    loadingText?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'teal' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    fullWidth?: boolean;
    style?: CSSProperties;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}
const V = {
    primary: {
        bg: 'linear-gradient(135deg,#0F2A7A,#1E3FAF)',
        color: '#fff',
        border: 'none',
        shadow: '0 2px 10px rgba(15,42,122,0.22)',
        hover: '0 6px 20px rgba(15,42,122,0.32)',
    },
    secondary: {
        bg: 'transparent',
        color: '#0F2A7A',
        border: '1.5px solid #0F2A7A',
        shadow: 'none',
        hover: '0 2px 8px rgba(15,42,122,0.12)',
    },
    ghost: {
        bg: '#F4F6FB',
        color: '#0B0F1F',
        border: '1px solid #E4E8F0',
        shadow: 'none',
        hover: 'none',
    },
    teal: {
        bg: 'linear-gradient(135deg,#3BC6C6,#2AA8A8)',
        color: '#fff',
        border: 'none',
        shadow: '0 2px 10px rgba(59,198,198,0.25)',
        hover: '0 6px 20px rgba(59,198,198,0.35)',
    },
    danger: {
        bg: 'linear-gradient(135deg,#EF4444,#DC2626)',
        color: '#fff',
        border: 'none',
        shadow: '0 2px 10px rgba(239,68,68,0.22)',
        hover: '0 6px 18px rgba(239,68,68,0.32)',
    },
};
const S = {
    sm: { h: 34, p: '0 14px', fs: 13, r: 6, g: 6 },
    md: { h: 44, p: '0 22px', fs: 15, r: 8, g: 8 },
    lg: { h: 52, p: '0 28px', fs: 16, r: 10, g: 10 },
};
function BarWave({ color = '#fff' }: {
    color?: string;
}) {
    return (<>
      <style>{`@keyframes bwv{0%,100%{transform:scaleY(.4);opacity:.5}50%{transform:scaleY(1);opacity:1}}`}</style>
      <div style={{
            display: 'flex',
            gap: 3,
            alignItems: 'flex-end',
            height: 18,
        }}>
        {[6, 12, 18, 12, 8].map((h, i) => (<span key={i} style={{
                width: 3,
                height: h,
                borderRadius: 2,
                background: color,
                display: 'block',
                animation: `bwv .9s ease-in-out ${i * 0.1}s infinite`,
            }}/>))}
      </div>
    </>);
}
export default function BarWaveButton({ onClick, children, loadingText = 'Loading', variant = 'primary', size = 'md', disabled = false, fullWidth = false, style, className, type = 'button', }: Props) {
    const [loading, setLoading] = useState(false);
    const v = V[variant];
    const s = S[size];
    const waveColor = variant === 'secondary'
        ? '#0F2A7A'
        : variant === 'ghost'
            ? '#0B0F1F'
            : '#fff';
    const handleClick = useCallback(async () => {
        if (loading || disabled)
            return;
        setLoading(true);
        try {
            await onClick();
        }
        finally {
            setLoading(false);
        }
    }, [loading, disabled, onClick]);
    return (<button type={type} disabled={disabled || loading} className={className} onClick={handleClick} style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: s.g,
            height: s.h,
            padding: s.p,
            fontSize: s.fs,
            fontFamily: 'Inter,sans-serif',
            fontWeight: 500,
            borderRadius: s.r,
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            border: v.border,
            background: v.bg,
            color: v.color,
            boxShadow: v.shadow,
            opacity: disabled ? 0.5 : loading ? 0.88 : 1,
            transition: 'transform .2s, box-shadow .2s',
            width: fullWidth ? '100%' : undefined,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            ...style,
        }} onMouseEnter={(e) => {
            if (!loading && !disabled) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = v.hover;
            }
        }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = v.shadow;
        }}>
      {loading ? (<>
          <BarWave color={waveColor}/>
          <span style={{ fontSize: s.fs - 1 }}>{loadingText}</span>
        </>) : (children)}
    </button>);
}
