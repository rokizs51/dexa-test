import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { DrizzleService } from '@dexa/database';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DrizzleService,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        const isHealthy = await this.db.healthCheck();
        if (!isHealthy) {
          throw new Error('Database unhealthy');
        }
        return { database: { status: 'up' } };
      },
    ]);
  }
}
