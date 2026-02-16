import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { DrizzleService } from '@dexa/database';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, DrizzleService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
