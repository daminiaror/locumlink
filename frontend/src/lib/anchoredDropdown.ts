export type FixedDropdownBox = {
    left: number;
    top: number;
    width: number;
    maxHeight: number;
};

const DROPDOWN_VIEWPORT_PAD = 8;
const DROPDOWN_GAP = 4;

/** Keep anchored menus inside the viewport (mobile-safe; desktop unchanged when space allows). */
export function computeFixedDropdownBox(
    anchor: DOMRect,
    preferredMaxHeight: number,
    viewportPad = DROPDOWN_VIEWPORT_PAD,
): FixedDropdownBox {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxWidth = Math.max(160, vw - viewportPad * 2);
    let width = Math.min(anchor.width, maxWidth);
    let left = anchor.left;
    if (left + width > vw - viewportPad) {
        left = Math.max(viewportPad, vw - viewportPad - width);
    }
    if (left < viewportPad) {
        left = viewportPad;
        width = Math.min(maxWidth, vw - viewportPad * 2);
    }

    const spaceBelow = vh - anchor.bottom - DROPDOWN_GAP - viewportPad;
    const spaceAbove = anchor.top - DROPDOWN_GAP - viewportPad;
    const minUsable = Math.min(preferredMaxHeight, 160);

    let top: number;
    let maxHeight: number;
    if (spaceBelow >= minUsable || spaceBelow >= spaceAbove) {
        top = anchor.bottom + DROPDOWN_GAP;
        maxHeight = Math.min(preferredMaxHeight, Math.max(120, spaceBelow));
    } else {
        maxHeight = Math.min(preferredMaxHeight, Math.max(120, spaceAbove));
        top = Math.max(viewportPad, anchor.top - DROPDOWN_GAP - maxHeight);
        maxHeight = Math.min(maxHeight, anchor.top - DROPDOWN_GAP - viewportPad);
    }

    return {
        left,
        top,
        width,
        maxHeight: Math.max(120, maxHeight),
    };
}
