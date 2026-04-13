import { Module }          from '@nestjs/common';
import { LocumController } from './locum.controller.js';
import { LocumService }    from './locum.service.js';

@Module({
  controllers: [LocumController],
  providers:   [LocumService],
})
export class LocumModule {}
