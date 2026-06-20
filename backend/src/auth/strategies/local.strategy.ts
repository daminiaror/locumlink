import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Role, User } from '@prisma/client';
import { Request } from 'express';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<User> {
    const role = req.body?.role as Role | undefined;
    if (!role || !Object.values(Role).includes(role)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.validateCredentials(email, password, role);
  }
}
