import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark any route or controller as public.
 * Routes with @Public() skip JWT verification entirely.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
