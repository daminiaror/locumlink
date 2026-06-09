import type { CSSProperties } from 'react';

/** Title-case display for profile form copy (labels, headings, placeholders). */
export const profileTextCapitalize: CSSProperties = {
    textTransform: 'capitalize',
};

/** Shared step nav + section card headings on profile forms. */
export const profileSectionHeadingStyle: CSSProperties = {
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 1.25,
    color: '#0B0F1F',
    ...profileTextCapitalize,
};

export const PROFILE_FORM_CAPITALIZE_CLASS = 'profile-form-capitalize';

export const PROFILE_FORM_CAPITALIZE_CSS = `
.${PROFILE_FORM_CAPITALIZE_CLASS} label,
.${PROFILE_FORM_CAPITALIZE_CLASS} h1,
.${PROFILE_FORM_CAPITALIZE_CLASS} .profile-heading,
.${PROFILE_FORM_CAPITALIZE_CLASS} .profile-step-label,
.${PROFILE_FORM_CAPITALIZE_CLASS} .profile-form-hint,
.${PROFILE_FORM_CAPITALIZE_CLASS} select,
.${PROFILE_FORM_CAPITALIZE_CLASS} option {
  text-transform: capitalize;
}
.${PROFILE_FORM_CAPITALIZE_CLASS} input::placeholder,
.${PROFILE_FORM_CAPITALIZE_CLASS} textarea::placeholder {
  text-transform: capitalize;
}
.${PROFILE_FORM_CAPITALIZE_CLASS} .locum-section-header span,
.${PROFILE_FORM_CAPITALIZE_CLASS} button {
  text-transform: capitalize;
}
.${PROFILE_FORM_CAPITALIZE_CLASS} .profile-step-label,
.${PROFILE_FORM_CAPITALIZE_CLASS} .locum-section-header span,
.${PROFILE_FORM_CAPITALIZE_CLASS} .profile-section-title,
.${PROFILE_FORM_CAPITALIZE_CLASS} .profile-subsection-title {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  color: #0B0F1F;
}
@media (max-width: 768px) {
  .${PROFILE_FORM_CAPITALIZE_CLASS}.host-profile-inner > div > h1,
  .${PROFILE_FORM_CAPITALIZE_CLASS}.locum-profile-page > h1 {
    font-size: 20px !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-section-title,
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-subsection-title,
  .${PROFILE_FORM_CAPITALIZE_CLASS} .locum-section-header span {
    font-size: 15px !important;
    font-weight: 600 !important;
    line-height: 1.3 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-step-label {
    font-size: 14px !important;
    font-weight: 600 !important;
    line-height: 1.25 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} label {
    font-size: 14px !important;
    font-weight: 500 !important;
    line-height: 1.4 !important;
    color: #374151 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-form-hint {
    font-size: 12px !important;
    line-height: 1.4 !important;
    color: #6B7280 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-status-banner-title,
  .${PROFILE_FORM_CAPITALIZE_CLASS} .locum-profile-banner-text {
    font-size: 14px !important;
    font-weight: 600 !important;
    line-height: 1.35 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-status-banner-subtitle,
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-status-banner-meta {
    font-size: 12px !important;
    font-weight: 400 !important;
    line-height: 1.4 !important;
    color: #6B7280 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-progress-meta {
    font-size: 12px !important;
    line-height: 1.4 !important;
    color: #6B7280 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-primary-btn {
    font-size: 15px !important;
    font-weight: 600 !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} input:not([type="checkbox"]):not([type="radio"]),
  .${PROFILE_FORM_CAPITALIZE_CLASS} textarea,
  .${PROFILE_FORM_CAPITALIZE_CLASS} select,
  .${PROFILE_FORM_CAPITALIZE_CLASS} .host-profile-practice-mobile-trigger {
    font-size: 16px !important;
    min-height: 44px !important;
  }
  .${PROFILE_FORM_CAPITALIZE_CLASS} .host-step-nav-step > div:first-child {
    width: 32px !important;
    height: 32px !important;
    font-size: 14px !important;
  }
}
`;
