import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@app/auth-lib';

@ApiTags('health')
@Controller()
export class HealthController {
  @Public()
  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Gateway health' })
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      broker: 'RabbitMQ',
      transport: 'gRPC',
    };
  }
}
