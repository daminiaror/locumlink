import type { NotificationItem } from '@/lib/api';

const SUPPORT_EMAIL = 'support@locumlink.ca';

function contactSupportMailtoHref(): string {
  const subject = encodeURIComponent('Account suspension — support request');
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
}

const EVENT_DEFAULTS: Record<string, { href: string; actionLabel: string }> = {
  H_001_LOCUM_APPLIED: { href: '/host/dashboard', actionLabel: 'Review Application' },
  H_002_LOCUM_ACCEPTED: { href: '/host/dashboard', actionLabel: 'View Shift Details' },
  H_003_LOCUM_DECLINED: { href: '/host/dashboard?postJob=1', actionLabel: 'Repost Opportunity' },
  H_004_NEW_MESSAGE: { href: '/host/messages', actionLabel: 'Read Message' },
  H_005_ACCOUNT_VERIFIED: { href: '/host/dashboard?postJob=1', actionLabel: 'Post Your First Opportunity' },
  H_006_ACCOUNT_REJECTED: { href: '/host/profile', actionLabel: 'Complete Verification' },
  H_007_ACCOUNT_SUSPENDED: { href: contactSupportMailtoHref(), actionLabel: 'Contact Support' },
  H_008_POSTING_EXPIRING: { href: '/host/dashboard', actionLabel: 'Extend Opportunity' },
  H_009_SHIFT_CANCELLED: { href: '/host/dashboard?postJob=1', actionLabel: 'Repost Opportunity' },
  L_001_NEW_OPPORTUNITY: { href: '/locum/browse', actionLabel: 'Browse Opportunities' },
  L_002_HOST_CONFIRMED: { href: '/locum/dashboard', actionLabel: 'View Shift Details' },
  L_003_APPLICATION_ACCEPTED: { href: '/locum/dashboard', actionLabel: 'Confirm Availability' },
  L_004_APPLICATION_DECLINED: { href: '/locum/browse', actionLabel: 'Browse Opportunities' },
  L_005_SHIFT_REMINDER_48H: { href: '/locum/dashboard', actionLabel: 'View Schedule' },
  L_006_SHIFT_REMINDER_EVENING: { href: '/locum/dashboard', actionLabel: 'View Shift Details' },
  L_007_SHIFT_REMINDER_2H: { href: '/locum/dashboard', actionLabel: 'View Shift' },
  L_008_NEW_MESSAGE: { href: '/locum/messages', actionLabel: 'Reply' },
  L_009_ACCOUNT_VERIFIED: { href: '/locum/browse', actionLabel: 'Browse Opportunities' },
  L_010_ACCOUNT_REJECTED: { href: '/locum/profile', actionLabel: 'Complete Verification' },
  L_011_ACCOUNT_SUSPENDED: { href: contactSupportMailtoHref(), actionLabel: 'Contact Support' },
  L_012_SHIFT_CANCELLED: { href: '/locum/browse', actionLabel: 'Browse Opportunities' },
};

export function resolveNotificationAction(notif: NotificationItem): {
  href: string | null;
  actionLabel: string | null;
} {
  const eventType = notif.eventType?.trim() ?? '';
  const defaults = eventType ? EVENT_DEFAULTS[eventType] : undefined;
  const rawHref = notif.href?.trim();
  const href =
    rawHref && rawHref !== '/'
      ? rawHref
      : defaults?.href ?? null;
  const actionLabel =
    notif.actionLabel?.trim() || defaults?.actionLabel || null;
  return { href, actionLabel };
}

export function isExternalNotificationHref(href: string): boolean {
  return /^mailto:/i.test(href) || /^https?:\/\//i.test(href);
}
