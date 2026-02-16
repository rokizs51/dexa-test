import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { DrizzleService } from '@dexa/database';

@Module({
  imports: [StorageModule],
  controllers: [FileController],
  providers: [FileService, DrizzleService],
  exports: [FileService],
})
export class FileModule {}
