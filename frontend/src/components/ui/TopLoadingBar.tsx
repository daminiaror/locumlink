'use client';
import { useEffect, useRef, useState } from 'react';
import { subscribeTopLoader } from '@/lib/topLoader';
export { startLoader, stopLoader } from '@/lib/topLoader';
export default function TopLoadingBar() {
    const [active, setActive] = useState(false);
    const [width, setWidth] = useState(0);
    const [leaving, setLeaving] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => subscribeTopLoader(setActive), []);
    useEffect(() => {
        if (intervalRef.current != null)
            clearInterval(intervalRef.current);
        if (timeoutRef.current != null)
            clearTimeout(timeoutRef.current);
        intervalRef.current = null;
        timeoutRef.current = null;
        if (active) {
            setLeaving(false);
            setWidth(10);
            intervalRef.current = setInterval(() => {
                setWidth((w) => {
                    if (w >= 85) {
                        if (intervalRef.current != null) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        return 85;
                    }
                    const step = w < 30 ? 8 : w < 60 ? 4 : w < 80 ? 1.5 : 0.5;
                    return Math.min(w + step, 85);
                });
            }, 200);
        }
        else {
            setWidth(100);
            timeoutRef.current = setTimeout(() => {
                setLeaving(true);
                timeoutRef.current = setTimeout(() => {
                    setWidth(0);
                    setLeaving(false);
                    timeoutRef.current = null;
                }, 400);
            }, 200);
        }
        return () => {
            if (intervalRef.current != null)
                clearInterval(intervalRef.current);
            if (timeoutRef.current != null)
                clearTimeout(timeoutRef.current);
            intervalRef.current = null;
            timeoutRef.current = null;
        };
    }, [active]);
    if (width === 0 && !active)
        return null;
    return (<>
      <style>{`
        @keyframes shimmer-bar {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
      <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 99999,
            height: 3,
            width: `${width}%`,
            background: 'linear-gradient(90deg, #0F2A7A 0%, #1E3FAF 40%, #3BC6C6 70%, #0F2A7A 100%)',
            backgroundSize: '200% 100%',
            animation: active ? 'shimmer-bar 1.8s linear infinite' : 'none',
            borderRadius: '0 2px 2px 0',
            transition: active
                ? 'width 0.2s ease'
                : leaving
                    ? 'width 0.2s ease, opacity 0.4s ease'
                    : 'width 0.2s ease',
            opacity: leaving ? 0 : 1,
            boxShadow: '0 0 10px rgba(59,198,198,0.6), 0 0 4px rgba(15,42,122,0.4)',
        }}/>
      {active && (<div style={{
                position: 'fixed',
                top: 0,
                left: `calc(${width}% - 4px)`,
                zIndex: 99999,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#3BC6C6',
                boxShadow: '0 0 8px #3BC6C6, 0 0 16px rgba(59,198,198,0.6)',
                marginTop: -2.5,
                transition: 'left 0.2s ease',
            }}/>)}
    </>);
}
