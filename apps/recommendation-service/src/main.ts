import { bootstrapHybridService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridService({
    module: AppModule,
    serviceName: 'recommendation-service',
    httpPort: Number(process.env.PORT ?? 3004),
    grpcPort: Number(process.env.GRPC_PORT ?? 50054),
    grpcPackage: 'health',
    protoFile: 'health.proto',
    swaggerTitle: 'Recommendation Service',
    enableRmq: true,
    rmqQueue: 'recommendation_queue',
  });
}
void bootstrap();
