import { contactSupportMailtoHref } from './notification-copy.js';

export type NotificationActionDefaults = {
  href: string;
  actionLabel: string;
};

/** Fallback href + action when older rows lack payload fields. */
export const NOTIFICATION_EVENT_DEFAULTS: Record<
  string,
  NotificationActionDefaults
> = {
  H_001_LOCUM_APPLIED: {
    href: '/host/dashboard',
    actionLabel: 'Review Application',
  },
  H_002_LOCUM_ACCEPTED: {
    href: '/host/dashboard',
    actionLabel: 'View Shift Details',
  },
  H_003_LOCUM_DECLINED: {
    href: '/host/dashboard?postJob=1',
    actionLabel: 'Repost Opportunity',
  },
  H_004_NEW_MESSAGE: {
    href: '/host/messages',
    actionLabel: 'Read Message',
  },
  H_005_ACCOUNT_VERIFIED: {
    href: '/host/dashboard?postJob=1',
    actionLabel: 'Post Your First Opportunity',
  },
  H_006_ACCOUNT_REJECTED: {
    href: '/host/profile',
    actionLabel: 'Complete Verification',
  },
  H_007_ACCOUNT_SUSPENDED: {
    href: contactSupportMailtoHref(),
    actionLabel: 'Contact Support',
  },
  H_008_POSTING_EXPIRING: {
    href: '/host/dashboard',
    actionLabel: 'Extend Opportunity',
  },
  H_009_SHIFT_CANCELLED: {
    href: '/host/dashboard?postJob=1',
    actionLabel: 'Repost Opportunity',
  },
  L_001_NEW_OPPORTUNITY: {
    href: '/locum/browse',
    actionLabel: 'Browse Opportunities',
  },
  L_002_HOST_CONFIRMED: {
    href: '/locum/dashboard',
    actionLabel: 'View Shift Details',
  },
  L_003_APPLICATION_ACCEPTED: {
    href: '/locum/dashboard',
    actionLabel: 'Confirm Availability',
  },
  L_004_APPLICATION_DECLINED: {
    href: '/locum/browse',
    actionLabel: 'Browse Opportunities',
  },
  L_005_SHIFT_REMINDER_48H: {
    href: '/locum/dashboard',
    actionLabel: 'View Schedule',
  },
  L_006_SHIFT_REMINDER_EVENING: {
    href: '/locum/dashboard',
    actionLabel: 'View Shift Details',
  },
  L_007_SHIFT_REMINDER_2H: {
    href: '/locum/dashboard',
    actionLabel: 'View Shift',
  },
  L_008_NEW_MESSAGE: {
    href: '/locum/messages',
    actionLabel: 'Reply',
  },
  L_009_ACCOUNT_VERIFIED: {
    href: '/locum/browse',
    actionLabel: 'Browse Opportunities',
  },
  L_010_ACCOUNT_REJECTED: {
    href: '/locum/profile',
    actionLabel: 'Complete Verification',
  },
  L_011_ACCOUNT_SUSPENDED: {
    href: contactSupportMailtoHref(),
    actionLabel: 'Contact Support',
  },
  L_012_SHIFT_CANCELLED: {
    href: '/locum/browse',
    actionLabel: 'Browse Opportunities',
  },
};

export function resolveNotificationActionFields(
  eventType: string,
  payload: { href?: string; actionLabel?: string },
): NotificationActionDefaults {
  const defaults = NOTIFICATION_EVENT_DEFAULTS[eventType];
  const href = payload.href?.trim();
  const actionLabel = payload.actionLabel?.trim();
  return {
    href: href && href !== '/' ? href : (defaults?.href ?? '/'),
    actionLabel: actionLabel || defaults?.actionLabel || 'View',
  };
}
