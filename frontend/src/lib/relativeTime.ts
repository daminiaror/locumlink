export function relativeHoursOrDaysAgo(iso: string | null | undefined): string {
    if (!iso)
        return '—';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t))
        return '—';
    const diffMs = Date.now() - t;
    if (diffMs < 0)
        return 'Just now';
    const hoursTotal = Math.floor(diffMs / 3600000);
    if (hoursTotal < 24) {
        if (hoursTotal < 1)
            return 'Just now';
        return `${hoursTotal} hour${hoursTotal === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(diffMs / 86400000);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}
