import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AttendanceController } from './attendance.controller';

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
      {
        name: 'FILE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.FILE_SERVICE_HOST || 'file-service',
          port: parseInt(process.env.FILE_SERVICE_PORT || '3004', 10),
        },
      },
    ]),
  ],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
