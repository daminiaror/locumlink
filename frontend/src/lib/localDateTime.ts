/**
 * Local date/time from the user's device (browser uses OS timezone).
 * Use these helpers instead of UTC-only APIs for posting schedules and expiry UI.
 */

/** Current instant on the user's machine. */
export function getLocalNow(): Date {
    return new Date();
}

export function getLocalNowMs(): number {
    return Date.now();
}

/** IANA timezone from the OS, e.g. "America/Toronto". */
export function getLocalTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    }
    catch {
        return '';
    }
}

/** Calendar date YYYY-MM-DD in local timezone. */
export function localCalendarDateToIso(d: Date = getLocalNow()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Last moment of a local calendar day from YYYY-MM-DD. */
export function endOfLocalCalendarDay(isoDate: string): Date | null {
    const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m)
        return null;
    const end = new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        23,
        59,
        59,
        999,
    );
    return Number.isNaN(end.getTime()) ? null : end;
}

/** Start of a local calendar day from YYYY-MM-DD. */
export function startOfLocalCalendarDay(isoDate: string): Date | null {
    const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m)
        return null;
    const start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
    return Number.isNaN(start.getTime()) ? null : start;
}

/**
 * True after the full local calendar end day has passed.
 * Accepts YYYY-MM-DD or any Date/ISO string (mapped to local calendar day).
 */
export function isLocalPostingEndDatePassed(
    endDate: string | Date | null | undefined,
): boolean {
    if (endDate == null || endDate === '')
        return false;
    if (typeof endDate === 'string') {
        const raw = endDate.trim();
        const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : '';
        if (iso) {
            const end = endOfLocalCalendarDay(iso);
            return end != null && end.getTime() < getLocalNowMs();
        }
    }
    const d = new Date(endDate as string | Date);
    if (Number.isNaN(d.getTime()))
        return false;
    const end = endOfLocalCalendarDay(localCalendarDateToIso(d));
    return end != null && end.getTime() < getLocalNowMs();
}

/** Compare local calendar days only (YYYY-MM-DD). */
export function compareLocalCalendarDates(a: string, b: string): number {
    return a.localeCompare(b);
}

export type LocalTimeSnapshot = {
    nowMs: number;
    timezone: string;
    calendarDateIso: string;
    offsetMinutes: number;
};

/** Snapshot of desktop local time for logging or API headers. */
export function getLocalTimeSnapshot(): LocalTimeSnapshot {
    const now = getLocalNow();
    return {
        nowMs: now.getTime(),
        timezone: getLocalTimezone(),
        calendarDateIso: localCalendarDateToIso(now),
        offsetMinutes: -now.getTimezoneOffset(),
    };
}
