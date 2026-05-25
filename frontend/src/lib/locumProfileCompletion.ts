import type { LocumProfile } from '@/types';

function hasTrimmedFile(primary?: string | null, alternate?: string | null): boolean {
    const v = (primary ?? '').trim() || (alternate ?? '').trim();
    return v.length > 0;
}

export function locumProfileCompletionPct(profile: LocumProfile | null | undefined): number {
    if (!profile)
        return 0;

    const specs = profile.specialization
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

    const checks = [
        !!(profile.firstName ?? '').trim(),
        !!(profile.lastName ?? '').trim(),
        !!(profile.cpsnsNumber ?? '').trim(),
        !!(profile.professionalSummary ?? '').trim(),
        specs.length > 0,
        !!(profile.phone ?? '').trim(),
        !!(profile.address1 ?? '').trim(),
        !!(profile.city ?? '').trim(),
        !!(profile.province ?? '').trim(),
        !!(profile.postalCode ?? '').trim(),
        (profile.yearsOfExperience ?? null) !== null,
        hasTrimmedFile(profile.licenseFile, profile.licenseFileName),
        hasTrimmedFile(profile.resumeFile, profile.resumeFileName),
        hasTrimmedFile(profile.extraFile, profile.extraFileName),
    ];

    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
}
