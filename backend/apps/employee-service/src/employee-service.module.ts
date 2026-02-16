import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { EmployeeServiceController } from './employee-service.controller';
import { EmployeeServiceService } from './employee-service.service';
import { HealthController } from './health/health.controller';
import { DrizzleService } from '@dexa/database';
import { EmployeeModule } from './employee/employee.module';

@Module({
  imports: [TerminusModule, EmployeeModule],
  controllers: [EmployeeServiceController, HealthController],
  providers: [EmployeeServiceService, DrizzleService],
  exports: [DrizzleService],
})
export class EmployeeServiceModule {}
