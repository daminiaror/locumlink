'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
    computeFixedDropdownBox,
    type FixedDropdownBox,
} from '@/lib/anchoredDropdown';

export function useAnchoredDropdownMenu(
    open: boolean,
    setOpen: (open: boolean) => void,
    anchorRef: React.RefObject<HTMLElement | null>,
    menuRef: React.RefObject<HTMLElement | null>,
    preferredMaxHeight: number,
): FixedDropdownBox | null {
    const [menuBox, setMenuBox] = useState<FixedDropdownBox | null>(null);
    const syncMenuBox = useCallback(() => {
        const el = anchorRef.current;
        if (!el)
            return;
        setMenuBox(computeFixedDropdownBox(el.getBoundingClientRect(), preferredMaxHeight));
    }, [anchorRef, preferredMaxHeight]);

    useLayoutEffect(() => {
        if (!open) {
            setMenuBox(null);
            return;
        }
        syncMenuBox();
    }, [open, syncMenuBox]);

    useEffect(() => {
        if (!open)
            return;
        function onOutside(e: PointerEvent) {
            const t = e.target as Node;
            if (anchorRef.current?.contains(t) || menuRef.current?.contains(t))
                return;
            setOpen(false);
        }
        function onReposition() {
            syncMenuBox();
        }
        document.addEventListener('pointerdown', onOutside, true);
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
        return () => {
            document.removeEventListener('pointerdown', onOutside, true);
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open, syncMenuBox, setOpen, anchorRef, menuRef]);

    return menuBox;
}
