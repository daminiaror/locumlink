import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { ADMIN_GOOGLE_STRATEGY } from '../admin-auth.constants.js';
import { AdminAuthService } from '../admin-auth.service.js';

@Injectable()
export class AdminGoogleStrategy extends PassportStrategy(Strategy, ADMIN_GOOGLE_STRATEGY) {
  constructor(config: ConfigService, private readonly adminAuth: AdminAuthService) {
    const id = config.get<string>('GOOGLE_ADMIN_CLIENT_ID', '').trim();
    const secret = config.get<string>('GOOGLE_ADMIN_CLIENT_SECRET', '').trim();
    super({
      clientID: id || 'DISABLED_MISSING_GOOGLE_ADMIN_CLIENT_ID',
      clientSecret: secret || 'DISABLED_MISSING_GOOGLE_ADMIN_CLIENT_SECRET',
      callbackURL: config
        .get<string>(
          'GOOGLE_ADMIN_CALLBACK_URL',
          'http://localhost:3000/api/admin-auth/google/callback',
        )
        .trim(),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<{ adminId: string; email: string }> {
    const email = profile.emails?.[0]?.value;
    const admin = await this.adminAuth.assertEmailIsAllowedAdmin(email);
    return { adminId: admin.id, email: admin.email };
  }
}
