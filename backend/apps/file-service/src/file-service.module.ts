import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { FileServiceController } from './file-service.controller';
import { FileServiceService } from './file-service.service';
import { HealthController } from './health/health.controller';
import { DrizzleService } from '@dexa/database';
import { StorageModule } from './storage/storage.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [TerminusModule, StorageModule, FileModule],
  controllers: [FileServiceController, HealthController],
  providers: [FileServiceService, DrizzleService],
  exports: [DrizzleService, StorageModule],
})
export class FileServiceModule {}
