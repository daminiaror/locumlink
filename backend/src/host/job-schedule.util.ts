import { BadRequestException } from '@nestjs/common';

/** YYYY-MM-DD from date-only or ISO string (calendar day as written, not UTC-shifted). */
export function extractCalendarDatePart(
  value: string | null | undefined,
): string | null {
  const t = value?.trim() ?? '';
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Store @db.Date as UTC midnight of the calendar day (stable across zones). */
export function parseCalendarDateForDb(value: string): Date {
  const cal = extractCalendarDatePart(value);
  if (!cal) {
    throw new BadRequestException('Invalid date format.');
  }
  const [y, mo, d] = cal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (Number.isNaN(dt.getTime())) {
    throw new BadRequestException('Invalid date.');
  }
  return dt;
}

/** Serialize Prisma DATE for API consumers as YYYY-MM-DD. */
export function formatCalendarDateForApi(
  value: Date | string | null | undefined,
): string | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const cal = extractCalendarDatePart(value);
    return cal;
  }
  if (Number.isNaN(value.getTime())) return null;
  const y = value.getUTCFullYear();
  const mo = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function hasTimezoneOffset(iso: string): boolean {
  return /([+-]\d{2}:\d{2}|Z)$/i.test(iso.trim());
}

/**
 * Parse schedule instant from ISO 8601 (must include offset or Z).
 * Uses the offset embedded in the timestamp — never assumes UTC or a fixed zone.
 */
export function parseScheduleInstantMs(
  isoWithOffset: string,
  label: string,
): number {
  const trimmed = isoWithOffset.trim();
  if (!trimmed.includes('T')) {
    throw new BadRequestException(
      `${label} must be sent as a timezone-aware ISO 8601 timestamp.`,
    );
  }
  if (!hasTimezoneOffset(trimmed)) {
    throw new BadRequestException(
      `${label} must include a timezone offset (e.g. -04:00).`,
    );
  }
  const ms = new Date(trimmed).getTime();
  if (Number.isNaN(ms)) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return ms;
}

export function assertJobScheduleAcceptable(params: {
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  /** Skip "in the past" checks for drafts. */
  allowPast?: boolean;
}): { startDate?: Date; endDate?: Date } {
  const startRaw = params.startDate?.trim() ?? '';
  const endRaw = params.endDate?.trim() ?? '';
  const hasStart = startRaw.length > 0;
  const hasEnd = endRaw.length > 0;

  if (!hasStart && !hasEnd) {
    return {};
  }

  let startDb: Date | undefined;
  let endDb: Date | undefined;

  if (hasStart) {
    startDb = parseCalendarDateForDb(startRaw);
  }
  if (hasEnd) {
    endDb = parseCalendarDateForDb(endRaw);
  }

  if (startDb && endDb && endDb.getTime() < startDb.getTime()) {
    throw new BadRequestException(
      'End date must be on or after the start date.',
    );
  }

  const startHasInstant = startRaw.includes('T');
  const endHasInstant = endRaw.includes('T');
  const hasClockTimes =
    Boolean(params.startTime?.trim()) && Boolean(params.endTime?.trim());

  if (!params.allowPast && hasStart && startHasInstant) {
    const startMs = parseScheduleInstantMs(startRaw, 'Start date');
    if (startMs < Date.now()) {
      throw new BadRequestException(
        'Start date and time cannot be in the past.',
      );
    }
  }

  if (hasStart && hasEnd && startHasInstant && endHasInstant) {
    const startMs = parseScheduleInstantMs(startRaw, 'Start date');
    const endMs = parseScheduleInstantMs(endRaw, 'End date');
    if (endMs <= startMs) {
      throw new BadRequestException('End time must be after start time.');
    }
  } else if (
    hasStart &&
    hasEnd &&
    hasClockTimes &&
    startDb &&
    endDb &&
    formatCalendarDateForApi(startDb) === formatCalendarDateForApi(endDb)
  ) {
    const st = params.startTime!.trim();
    const en = params.endTime!.trim();
    if (en <= st) {
      throw new BadRequestException('End time must be after start time.');
    }
  }

  if (!params.allowPast && (hasStart || hasEnd) && hasClockTimes) {
    if (hasStart && !startHasInstant) {
      throw new BadRequestException(
        'Start date must be sent as a timezone-aware ISO 8601 timestamp.',
      );
    }
    if (hasEnd && !endHasInstant) {
      throw new BadRequestException(
        'End date must be sent as a timezone-aware ISO 8601 timestamp.',
      );
    }
  }

  return {
    ...(startDb != null && { startDate: startDb }),
    ...(endDb != null && { endDate: endDb }),
  };
}

/** True after the stored calendar end day (UTC date components) has fully passed. */
export function isPostingEndDatePassed(
  endDate: Date | null | undefined,
): boolean {
  if (!endDate) return false;
  if (Number.isNaN(endDate.getTime())) return false;
  const y = endDate.getUTCFullYear();
  const mo = endDate.getUTCMonth();
  const d = endDate.getUTCDate();
  const endOfStoredDay = Date.UTC(y, mo, d, 23, 59, 59, 999);
  return endOfStoredDay < Date.now();
}
