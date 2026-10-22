import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/auth-lib';

@ApiTags('health')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', service: 'interaction-service' };
  }
}
