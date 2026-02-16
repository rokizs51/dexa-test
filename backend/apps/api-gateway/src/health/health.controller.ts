import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '@dexa/common';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  @Public()
  @ApiOperation({ summary: 'Health check', description: 'Check if the API and its services are running' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        return { api: { status: 'up' } };
      },
    ]);
  }
}
