import { bootstrapHybridService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridService({
    module: AppModule,
    serviceName: 'media-service',
    httpPort: Number(process.env.PORT ?? 3007),
    grpcPort: Number(process.env.GRPC_PORT ?? 50057),
    grpcPackage: 'health',
    protoFile: 'health.proto',
    swaggerTitle: 'Media Service',
  });
}
void bootstrap();
