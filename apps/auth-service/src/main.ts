import { bootstrapHybridService } from '@app/common';
import { AuthModule } from './auth.module';

async function bootstrap() {
  await bootstrapHybridService({
    module: AuthModule,
    serviceName: 'auth-service',
    httpPort: Number(process.env.PORT ?? 3001),
    grpcPort: Number(process.env.GRPC_PORT ?? 50051),
    grpcPackage: 'auth',
    protoFile: 'auth.proto',
    swaggerTitle: 'Auth Service',
  });
}
void bootstrap();
