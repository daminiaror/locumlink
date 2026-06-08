'use client';

import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import type { FixedDropdownBox } from '@/lib/anchoredDropdown';

export const anchoredDropdownMenuBaseStyle: CSSProperties = {
    position: 'fixed',
    background: '#fff',
    border: '1px solid #E4E8F0',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(15,42,122,0.13)',
    zIndex: 100020,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
    boxSizing: 'border-box',
};

type AnchoredDropdownPortalProps = {
    open: boolean;
    menuBox: FixedDropdownBox | null;
    menuRef: RefObject<HTMLDivElement | null>;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
};

export function AnchoredDropdownPortal({
    open,
    menuBox,
    menuRef,
    className,
    style,
    children,
}: AnchoredDropdownPortalProps) {
    if (!open || !menuBox || typeof document === 'undefined')
        return null;
    return createPortal(
        <div
            ref={menuRef}
            data-anchored-dropdown
            className={className ? `anchored-dropdown-menu ${className}` : 'anchored-dropdown-menu'}
            style={{
                ...anchoredDropdownMenuBaseStyle,
                left: menuBox.left,
                top: menuBox.top,
                width: menuBox.width,
                maxHeight: menuBox.maxHeight,
                ...style,
            }}
        >
            {children}
        </div>,
        document.body,
    );
}
