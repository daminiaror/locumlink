import { Module }         from '@nestjs/common';
import { HostController } from './host.controller.js';
import { HostService }    from './host.service.js';

@Module({
  controllers: [HostController],
  providers:   [HostService],
})
export class HostModule {}
