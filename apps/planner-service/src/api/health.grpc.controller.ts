import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class HealthGrpcController {
  @GrpcMethod('HealthService', 'Check')
  check() {
    return { status: 'ok', service: process.env.SERVICE_NAME ?? 'planner-service' };
  }
}
