import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmployeeController } from './employee.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EMPLOYEE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.EMPLOYEE_SERVICE_HOST || 'employee-service',
          port: parseInt(process.env.EMPLOYEE_SERVICE_PORT || '3002', 10),
        },
      },
    ]),
  ],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
