import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TerminusModule, AuthModule],
  controllers: [AuthServiceController, HealthController],
  providers: [AuthServiceService],
  exports: [AuthModule],
})
export class AuthServiceModule {}
