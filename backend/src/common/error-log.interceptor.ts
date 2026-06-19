import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../notifications/email.service.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ErrorLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id ?? null;
    const route = req.url ?? null;
    const method = req.method ?? null;
    return next.handle().pipe(
      catchError((err) => {
        const isHttp = err instanceof HttpException;
        const statusCode = isHttp ? err.getStatus() : 500;
        const message = err?.message ?? 'Unknown error';
        const stack = err?.stack ?? null;
        this.prisma.errorLog.create({
          data: { userId, route, method, statusCode, message, stack, metadata: { userAgent: req.headers['user-agent'] ?? null, ip: req.ip ?? null } },
        }).catch((dbErr) => console.error('[ErrorLog] DB save failed:', dbErr));
        if (statusCode >= 500) {
          const adminEmail = this.config.get<string>('ADMIN_ALERT_EMAIL');
          if (adminEmail) {
            this.email.send({
              to: adminEmail,
              subject: `Server Error [${statusCode}] — ${method} ${route}`,
              text: `Error: ${message}\nUser ID: ${userId ?? 'unauthenticated'}\nRoute: ${method} ${route}\nTime: ${new Date().toISOString()}\nStack:\n${stack ?? 'N/A'}`,
            }).catch((e) => console.error('[ErrorLog] Email failed:', e));
          }
        }
        return throwError(() => err);
      }),
    );
  }
}
