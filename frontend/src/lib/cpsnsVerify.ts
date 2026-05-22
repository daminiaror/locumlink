export type CpsnsVerificationStatus =
    | 'UNVERIFIED'
    | 'PENDING_REVIEW'
    | 'VERIFIED'
    | 'REJECTED';

export function normalizeCpsns(input: string | null | undefined): string {
    return String(input ?? '').replace(/\D/g, '');
}

export function isCpsnsNineDigitsFormat(input: string | null | undefined): boolean {
    return normalizeCpsns(input).length === 9;
}

export function sanitizeCpsnsInput(raw: string): string {
    return normalizeCpsns(raw).slice(0, 9);
}

/** True only after an admin approves CPSNS in the verifications queue. */
export function isCpsnsVerificationApproved(
    status: CpsnsVerificationStatus | null | undefined,
): boolean {
    return status === 'VERIFIED';
}

/** CPSNS save patch for locum and host profiles. */
export function cpsnsVerificationData(
    existing: { cpsnsNumber: string | null; cpsnsVerificationStatus: CpsnsVerificationStatus } | null,
    cpsnsDigits: string,
): { cpsnsVerificationStatus: CpsnsVerificationStatus; cpsnsVerifiedAt: Date | null } | null {
    if (cpsnsDigits.length !== 9) return null;
    if (!existing) {
        return { cpsnsVerificationStatus: 'PENDING_REVIEW', cpsnsVerifiedAt: null };
    }
    const prevDigits = normalizeCpsns(existing.cpsnsNumber);
    const cpsnsChanged = prevDigits !== cpsnsDigits;
    if (existing.cpsnsVerificationStatus === 'VERIFIED' && cpsnsChanged) {
        return { cpsnsVerificationStatus: 'PENDING_REVIEW', cpsnsVerifiedAt: null };
    }
    if (
        existing.cpsnsVerificationStatus === 'UNVERIFIED'
        || existing.cpsnsVerificationStatus === 'REJECTED'
    ) {
        return { cpsnsVerificationStatus: 'PENDING_REVIEW', cpsnsVerifiedAt: null };
    }
    return null;
}

/** @deprecated Use cpsnsVerificationData */
export const hostCpsnsVerificationData = cpsnsVerificationData;

export function isHostVerificationPending(
    status: CpsnsVerificationStatus | null | undefined,
): boolean {
    return status === 'UNVERIFIED' || status === 'PENDING_REVIEW';
}

/** Profiles that should appear in the admin credential / verifications queue. */
export function isInCredentialQueue(
    status: CpsnsVerificationStatus | null | undefined,
): boolean {
    return (
        status === 'UNVERIFIED'
        || status === 'PENDING_REVIEW'
        || status === 'REJECTED'
    );
}

export function isEligibleForCredentialQueueLocum(profile: {
    cpsnsVerificationStatus: CpsnsVerificationStatus | null | undefined;
    cpsnsId: string | null | undefined;
    licenseFileName?: string | null;
    resumeFileName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}): boolean {
    if (!isInCredentialQueue(profile.cpsnsVerificationStatus)) return false;
    const hasCpsns = isCpsnsNineDigitsFormat(profile.cpsnsId);
    const hasProfile = Boolean(
        profile.licenseFileName?.trim()
        || profile.resumeFileName?.trim()
        || profile.firstName?.trim()
        || profile.lastName?.trim(),
    );
    return hasCpsns || hasProfile;
}

export function isEligibleForCredentialQueueHost(profile: {
    cpsnsVerificationStatus: CpsnsVerificationStatus | null | undefined;
    cpsnsNumber: string | null | undefined;
    practiceName?: string | null;
    licenseFile?: string | null;
    photoIdFile?: string | null;
}): boolean {
    if (!isInCredentialQueue(profile.cpsnsVerificationStatus)) return false;
    const hasCpsns = isCpsnsNineDigitsFormat(profile.cpsnsNumber);
    const hasClinicProfile = Boolean(profile.practiceName?.trim());
    const hasDocs = Boolean(
        profile.licenseFile?.trim() || profile.photoIdFile?.trim(),
    );
    return hasCpsns || hasClinicProfile || hasDocs;
}

/** Promote to review queue when profile/docs were saved (mirrors backend save). */
export function credentialReviewDataOnProfileSave(
    existing: { cpsnsNumber: string | null; cpsnsVerificationStatus: CpsnsVerificationStatus } | null,
    cpsnsDigits: string,
    profileSubmittedForReview: boolean,
): { cpsnsVerificationStatus: CpsnsVerificationStatus; cpsnsVerifiedAt: Date | null } | null {
    const cpsnsPatch = cpsnsVerificationData(existing, cpsnsDigits);
    if (cpsnsPatch)
        return cpsnsPatch;
    if (!profileSubmittedForReview)
        return null;
    if (!existing) {
        return { cpsnsVerificationStatus: 'PENDING_REVIEW', cpsnsVerifiedAt: null };
    }
    if (
        existing.cpsnsVerificationStatus === 'UNVERIFIED'
        || existing.cpsnsVerificationStatus === 'REJECTED'
    ) {
        return { cpsnsVerificationStatus: 'PENDING_REVIEW', cpsnsVerifiedAt: null };
    }
    return null;
}

function hasSubmittedCpsnsValue(cpsns: string | null | undefined): boolean {
    const raw = (cpsns ?? '').trim();
    if (!raw || raw === '—')
        return false;
    return !/^pending-/i.test(raw);
}

/** Nine-digit CPSNS when present; empty when missing or placeholder. */
export function adminCpsnsNumberOrEmpty(
    cpsns: string | null | undefined,
): string {
    if (!hasSubmittedCpsnsValue(cpsns))
        return '';
    const digits = normalizeCpsns(cpsns);
    return isCpsnsNineDigitsFormat(digits) ? digits : '';
}

/** Admin tables: show CPSNS digits or "Not provided". */
export function formatAdminCpsnsDisplay(cpsns: string | null | undefined): string {
    return adminCpsnsNumberOrEmpty(cpsns) || 'Not provided';
}

/** Admin verifications table: label + colors for the Status column. */
export function adminVerificationStatusTag(
    status: CpsnsVerificationStatus,
    cpsns: string,
): { label: string; background: string; color: string } {
    if (status === 'PENDING_REVIEW') {
        return {
            label: 'Awaiting review',
            background: 'rgba(59, 79, 216, 0.12)',
            color: '#1B31D2',
        };
    }
    if (status === 'REJECTED') {
        return {
            label: 'Not verified',
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#92400e',
        };
    }
    if (hasSubmittedCpsnsValue(cpsns) && !isCpsnsNineDigitsFormat(cpsns)) {
        return {
            label: 'Not verified',
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#92400e',
        };
    }
    if (isCpsnsNineDigitsFormat(cpsns)) {
        return {
            label: 'Awaiting review',
            background: 'rgba(59, 79, 216, 0.12)',
            color: '#1B31D2',
        };
    }
    return {
        label: 'CPSNS not provided',
        background: 'rgba(148, 163, 184, 0.2)',
        color: '#475569',
    };
}
