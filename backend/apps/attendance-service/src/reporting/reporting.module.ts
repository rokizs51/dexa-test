import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { DrizzleService } from '@dexa/database';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, DrizzleService],
  exports: [ReportingService],
})
export class ReportingModule {}
