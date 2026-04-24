import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { GcsModule } from '../gcs/gcs.module.js';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';
@Module({
    imports: [PrismaModule, GcsModule],
    controllers: [MessageController],
    providers: [MessageService],
    exports: [MessageService],
})
export class MessageModule {
}
