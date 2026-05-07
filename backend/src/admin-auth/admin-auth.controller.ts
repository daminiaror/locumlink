import { Controller, Get, Req, Res, UseFilters, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import type { AdminJwtPayload } from './admin-auth.types.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { AdminAuthService } from './admin-auth.service.js';
import { ADMIN_AUTH_COOKIE_OPTS, ADMIN_GOOGLE_STRATEGY } from './admin-auth.constants.js';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard.js';
import { AdminGoogleEnabledGuard } from './guards/admin-google-enabled.guard.js';
import { RedirectAdminOAuthToLoginFilter } from './filters/redirect-admin-oauth-login.filter.js';
import { CurrentAdmin } from './decorators/current-admin.decorator.js';

@Public()
@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  /** Browser hits this → redirect to Google (credentials in backend/.env, not Supabase). */
  @Get('google')
  @UseGuards(AdminGoogleEnabledGuard, AuthGuard(ADMIN_GOOGLE_STRATEGY))
  googleAuth(): void {
    /* Passport issues HTTP redirect */
  }

  @Get('google/callback')
  @UseFilters(RedirectAdminOAuthToLoginFilter)
  @UseGuards(AdminGoogleEnabledGuard, AuthGuard(ADMIN_GOOGLE_STRATEGY))
  async googleAuthCallback(
    @Req() req: { user: { adminId: string; email: string } },
    @Res() res: Response,
  ) {
    const u = req.user;
    const token = await this.adminAuth.signAdminJwt({
      adminId: u.adminId,
      email: u.email,
    });

    res.cookie(this.adminAuth.getCookieName(), token, {
      ...ADMIN_AUTH_COOKIE_OPTS,
      maxAge: this.adminAuth.parseAdminJwtCookieMaxAgeMs(),
    });

    return res.redirect(this.adminAuth.getFrontendRedirectUrl());
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    res.clearCookie(this.adminAuth.getCookieName(), { path: '/' });
    return res.status(200).json({ ok: true });
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  async me(@CurrentAdmin() admin: AdminJwtPayload) {
    return { admin };
  }
}
