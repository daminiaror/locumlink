export function normalizeCpsns(input: string | null | undefined): string {
    return String(input ?? '').replace(/\D/g, '');
}
export function isCpsnsNineDigitsFormat(input: string | null | undefined): boolean {
    return normalizeCpsns(input).length === 9;
}
export function sanitizeCpsnsInput(raw: string): string {
    return normalizeCpsns(raw).slice(0, 9);
}
const VERIFIED_CPSNS = new Set([
    '895874638',
    '152364789',
    '741258963',
    '582369741',
]);
export function isCpsnsVerified(cpsns: string | null | undefined): boolean {
    const n = normalizeCpsns(cpsns);
    return n.length > 0 && VERIFIED_CPSNS.has(n);
}
