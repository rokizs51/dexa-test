import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FileController } from './file.controller';

@Module({
  imports: [
    ClientsModule.register([
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
  controllers: [FileController],
})
export class FileModule {}
