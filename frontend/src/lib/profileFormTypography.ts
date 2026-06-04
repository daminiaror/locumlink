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
.${PROFILE_FORM_CAPITALIZE_CLASS} .locum-section-header span {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  color: #0B0F1F;
}
@media (max-width: 768px) {
  .${PROFILE_FORM_CAPITALIZE_CLASS} .profile-step-label,
  .${PROFILE_FORM_CAPITALIZE_CLASS} .locum-section-header span {
    font-size: 15px;
  }
}
`;
