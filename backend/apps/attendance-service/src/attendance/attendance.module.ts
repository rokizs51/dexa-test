import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { DrizzleService } from '@dexa/database';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, DrizzleService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
