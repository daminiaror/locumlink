'use client';
import { AmenitiesSelector } from '@/components/AmenitiesSelector';
const sectionTitle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 500,
    lineHeight: '140%',
    color: '#0B0F1F',
};
export interface HostSetupStep3Props {
    amenities: string[];
    onAmenitiesChange: (items: string[]) => void;
    accommodationProvided: boolean;
    onAccommodationChange: (value: boolean) => void;
}
export function HostSetupStep3({ amenities, onAmenitiesChange, accommodationProvided, onAccommodationChange, }: HostSetupStep3Props) {
    return (<div className="host-setup-step3-body">
      <div style={sectionTitle}>Services Offered</div>

      <AmenitiesSelector selected={amenities} onChange={onAmenitiesChange}/>

      <label className="host-setup-step3-accommodation">
        <input type="checkbox" checked={accommodationProvided} onChange={(e) => onAccommodationChange(e.target.checked)}/>
        Accommodation provided for Locum physicians
      </label>
    </div>);
}
