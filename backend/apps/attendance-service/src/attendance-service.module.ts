import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AttendanceServiceController } from './attendance-service.controller';
import { AttendanceServiceService } from './attendance-service.service';
import { HealthController } from './health/health.controller';
import { DrizzleService } from '@dexa/database';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [TerminusModule, AttendanceModule, ReportingModule],
  controllers: [AttendanceServiceController, HealthController],
  providers: [AttendanceServiceService, DrizzleService],
  exports: [DrizzleService],
})
export class AttendanceServiceModule {}
