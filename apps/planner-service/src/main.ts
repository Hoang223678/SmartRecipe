import { bootstrapHybridService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridService({
    module: AppModule,
    serviceName: 'planner-service',
    httpPort: Number(process.env.PORT ?? 3006),
    grpcPort: Number(process.env.GRPC_PORT ?? 50056),
    grpcPackage: 'health',
    protoFile: 'health.proto',
    swaggerTitle: 'Planner Service',
  });
}
void bootstrap();
