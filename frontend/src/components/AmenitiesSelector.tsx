'use client';

import { useState } from 'react';

/** Frame 2043683669 — preset amenities */
export const AMENITY_OPTIONS_STEP3 = [
  'On-site Parking',
  'Digital X-Ray',
  'Laboratory services',
  'Pharmacy services',
  'Cafeteria',
  'Private Office space',
  'Admin support',
  'IT support',
] as const;

export interface AmenitiesSelectorProps {
  selected: string[];
  onChange?: (items: string[]) => void;
}

export function AmenitiesSelector({ selected, onChange }: AmenitiesSelectorProps) {
  const [open, setOpen] = useState(false);

  const toggle = (item: string) => {
    const next = selected.includes(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    onChange?.(next);
  };

  const remove = (item: string) => {
    onChange?.(selected.filter((s) => s !== item));
  };

  const addCustomAmenity = () => {
    const v = typeof window !== 'undefined' ? window.prompt('Add amenity') : null;
    if (!v?.trim()) return;
    const t = v.trim();
    if (selected.includes(t)) return;
    onChange?.([...selected, t]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {/* Label */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 400,
          lineHeight: '140%',
          color: 'rgba(11, 15, 31, 0.8)',
        }}
      >
        Amenities
      </div>

      {/* Dropdown container */}
      <div
        style={{
          width: '100%',
          border: '1px solid #D0D5DD',
          borderRadius: 8,
          background: '#fff',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Toolbar: chips + chevron */}
        <div
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            minHeight: 44,
            cursor: 'pointer',
            gap: 8,
            boxSizing: 'border-box',
          }}
        >
          {/* Chips / placeholder */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
              flex: 1,
              minWidth: 0,
            }}
          >
            {selected.length === 0 ? (
              <span style={{ fontSize: 16, color: '#9CA3AF', lineHeight: '140%' }}>
                Add Amenities
              </span>
            ) : (
              selected.map((item) => (
                <span
                  key={item}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: '1px solid #D0D5DD',
                    background: '#fff',
                    fontSize: 13,
                    color: '#0B0F1F',
                    lineHeight: '140%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(item); }}
                    aria-label={`Remove ${item}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6B7280',
                      fontSize: 15,
                      lineHeight: 1,
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Chevron */}
          <span
            aria-hidden
            style={{
              fontSize: 11,
              color: '#6B7280',
              flexShrink: 0,
              display: 'inline-block',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              lineHeight: 1,
            }}
          >
            ▼
          </span>
        </div>

        {/* Expandable checklist */}
        {open && (
          <div style={{ borderTop: '1px solid #E5E7EB', padding: '4px 0 8px' }}>
            {AMENITY_OPTIONS_STEP3.map((name) => (
              <label
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(name)}
                  onChange={() => toggle(name)}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: '#1B31D2',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 15, fontWeight: 400, color: '#0B0F1F', lineHeight: '140%' }}>
                  {name}
                </span>
              </label>
            ))}

            {/* + Add more */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); addCustomAmenity(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#1B31D2',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'inherit',
                lineHeight: '140%',
              }}
            >
              + Add more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}