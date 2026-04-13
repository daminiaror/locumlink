// PATH:   backend/src/auth/guards/jwt-auth.guard.ts
// ACTION: REPLACE your existing file completely

import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/**
 * Global JWT guard — registered as APP_GUARD in app.module.ts.
 * Runs on EVERY request automatically.
 *
 * Flow:
 *   1. Check if route has @Public() → if yes, skip JWT entirely
 *   2. Extract Bearer token from Authorization header
 *   3. Verify token signature using JWT_SECRET
 *   4. Call JwtStrategy.validate() → checks userId exists in DB
 *   5. Attach user to req.user → controller runs
 *   6. Any failure → 401 Unauthorized
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // If @Public() decorator is present on handler or class → skip JWT
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }
}
