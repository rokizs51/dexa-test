import { Module, forwardRef } from '@nestjs/common';
import { DrizzleService } from '@dexa/database';
import { BlacklistService } from './blacklist.service';

@Module({
  providers: [BlacklistService, DrizzleService],
  exports: [BlacklistService],
})
export class BlacklistModule {}
