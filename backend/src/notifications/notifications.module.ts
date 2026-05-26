import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
@Module({
    imports: [AuthModule, PrismaModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, PushService],
    exports: [PushService],
})
export class NotificationsModule {
}
