import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ATTENDANCE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ATTENDANCE_SERVICE_HOST || 'attendance-service',
          port: parseInt(process.env.ATTENDANCE_SERVICE_PORT || '3003', 10),
        },
      },
    ]),
  ],
  controllers: [ReportingController],
})
export class ReportingModule {}
