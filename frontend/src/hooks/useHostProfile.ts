import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import type { HostProfile } from '@/types';

export function useHostProfile() {
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = getSupabase();

    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data, error } = await sb
        .from('host_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!cancelled) {
        if (error && error.code !== 'PGRST116') setError(error.message);
        else setProfile(data ?? null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = useCallback(async (data: HostProfile) => {
    setSaving(true);
    setError(null);
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const row = {
      user_id: user.id,
      clinic_name: data.clinicName,
      contact_first_name: data.contactFirstName,
      contact_last_name: data.contactLastName,
      cpsns_number: data.cpsnsNumber,
      speciality: data.speciality,
      license_file: data.licenseFile ?? null,
      address1: data.address1,
      address2: data.address2 ?? '',
      postal_code: data.postalCode,
      city: data.city,
      province: data.province,
      amenities: data.amenities,
      accommodation_provided: data.accommodationProvided,
      practice_type: data.practiceType ?? '',
      num_physicians: data.numPhysicians ?? '',
      emr: data.emr ?? '',
      patient_vol: data.patientVol ?? '',
      clinic_desc: data.clinicDesc ?? '',
    };

    const { data: saved, error } = await sb
      .from('host_profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();

    setSaving(false);
    if (error) {
      setError(error.message);
      throw error;
    }

    // Map snake_case back to camelCase
    setProfile({
      clinicName: saved.clinic_name,
      contactFirstName: saved.contact_first_name,
      contactLastName: saved.contact_last_name,
      cpsnsNumber: saved.cpsns_number,
      speciality: saved.speciality,
      licenseFile: saved.license_file,
      address1: saved.address1,
      address2: saved.address2,
      postalCode: saved.postal_code,
      city: saved.city,
      province: saved.province,
      amenities: saved.amenities ?? [],
      accommodationProvided: saved.accommodation_provided,
      practiceType: saved.practice_type,
      numPhysicians: saved.num_physicians,
      emr: saved.emr,
      patientVol: saved.patient_vol,
      clinicDesc: saved.clinic_desc,
    });
  }, []);

  return { profile, loading, saving, error, saveProfile };
}
