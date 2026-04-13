import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Headers,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Role as PrismaRole } from '@prisma/client';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SyncSupabaseDto } from './dto/sync-supabase.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import type { User } from '@prisma/client';
import { AuthTokens } from './interfaces/auth-tokens.interface.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Public routes — no JWT needed ────────────────────────────────────────

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthTokens> {
    return this.authService.register(dto, { ip, userAgent });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthTokens> {
    return this.authService.login(dto, { ip, userAgent });
  }

  /**
   * After Supabase email OTP, call with `Authorization: Bearer <supabase_access_token>`
   * to receive Locum Link JWTs the API accepts.
   */
  @Public()
  @Post('sync-supabase')
  @HttpCode(HttpStatus.OK)
  syncSupabase(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SyncSupabaseDto,
  ): Promise<AuthTokens> {
    const prismaRole: PrismaRole =
      dto.role === 'clinic' ? PrismaRole.HOST : PrismaRole.LOCUM;
    return this.authService.syncFromSupabaseToken(authorization, prismaRole);
  }

  // ── Protected route — JWT required ───────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
