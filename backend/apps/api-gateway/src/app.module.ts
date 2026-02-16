import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { EmployeeModule } from './employee/employee.module';
import { FileModule } from './file/file.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportingModule } from './reporting/reporting.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TerminusModule, EmployeeModule, FileModule, AttendanceModule, ReportingModule, AuthModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
