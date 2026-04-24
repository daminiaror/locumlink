import citiesRaw from '@/data/cities.json';
export type CanadianCityRow = {
    name: string;
    province: string;
};
export const CANADIAN_CITY_ROWS: CanadianCityRow[] = (citiesRaw as [
    string,
    string
][]).map(([name, province]) => ({ name, province }));
export const CANADIAN_PROVINCE_NAMES: Record<string, string> = {
    AB: 'Alberta',
    BC: 'British Columbia',
    MB: 'Manitoba',
    NB: 'New Brunswick',
    NL: 'Newfoundland & Labrador',
    NS: 'Nova Scotia',
    NT: 'Northwest Territories',
    NU: 'Nunavut',
    ON: 'Ontario',
    PE: 'Prince Edward Island',
    QC: 'Quebec',
    SK: 'Saskatchewan',
    YT: 'Yukon',
};
export function filterCanadianCities(query: string, limit = 8): CanadianCityRow[] {
    if (!query || query.trim().length < 2)
        return [];
    const lower = query.trim().toLowerCase();
    let found = CANADIAN_CITY_ROWS.filter((c) => c.name.toLowerCase().startsWith(lower)).slice(0, limit);
    if (found.length < 4) {
        const keys = new Set(found.map((c) => `${c.name}|${c.province}`));
        const extra = CANADIAN_CITY_ROWS.filter((c) => !keys.has(`${c.name}|${c.province}`) &&
            c.name.toLowerCase().includes(lower)).slice(0, limit - found.length);
        found = [...found, ...extra];
    }
    return found.slice(0, limit);
}
export function formatCanadianCityDisplay(name: string): string {
    const t = name.trim();
    if (!t)
        return '';
    const lower = t.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}
