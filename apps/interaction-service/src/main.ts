import { bootstrapHybridService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridService({
    module: AppModule,
    serviceName: 'interaction-service',
    httpPort: Number(process.env.PORT ?? 3005),
    grpcPort: Number(process.env.GRPC_PORT ?? 50055),
    grpcPackage: 'health',
    protoFile: 'health.proto',
    swaggerTitle: 'Interaction Service',
  });
}
void bootstrap();
