import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthGrpcController } from './health.grpc.controller';
import { EventsController } from './events.controller';

@Module({
  controllers: [HealthController, HealthGrpcController, EventsController],
})
export class AppModule {}
