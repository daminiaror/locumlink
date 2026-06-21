export const GENERIC_USER_ERROR = 'Something went wrong. Please try again.';

const TECHNICAL_ERROR_PATTERN = /ECONNREFUSED|prisma\.|Invalid `|invocation in|\.ts:\d+|fetch failed|Failed to fetch|internal server error|DATABASE_URL|connection refused|ENOTFOUND|ETIMEDOUT|Could not reach the app API|server error|Nest backend|npm run|HTML page \(HTTP/i;

export function isTechnicalErrorMessage(message: string): boolean {
    const msg = message.trim();
    if (!msg)
        return false;
    if (msg.length > 100)
        return true;
    return TECHNICAL_ERROR_PATTERN.test(msg);
}

export function sanitizeErrorMessage(
    message: string | null | undefined,
    fallback = GENERIC_USER_ERROR,
): string {
    const msg = (message ?? '').trim();
    if (!msg)
        return '';
    if (isTechnicalErrorMessage(msg))
        return fallback;
    return msg;
}

export function toUserFacingError(
    err: unknown,
    fallback = GENERIC_USER_ERROR,
): string {
    if (!(err instanceof Error))
        return fallback;
    return sanitizeErrorMessage(err.message, fallback);
}
