import { bootstrapHybridService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridService({
    module: AppModule,
    serviceName: 'catalog-service',
    httpPort: Number(process.env.PORT ?? 3002),
    grpcPort: Number(process.env.GRPC_PORT ?? 50052),
    grpcPackage: 'health',
    protoFile: 'health.proto',
    swaggerTitle: 'Catalog Service',
  });
}
void bootstrap();
