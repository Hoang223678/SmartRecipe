import { bootstrapHybridService } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapHybridService({
    module: AppModule,
    serviceName: 'recipe-service',
    httpPort: Number(process.env.PORT ?? 3003),
    grpcPort: Number(process.env.GRPC_PORT ?? 50053),
    grpcPackage: ['recipe', 'health'],
    protoFile: ['recipe.proto', 'health.proto'],
    swaggerTitle: 'Recipe Service',
  });
}
void bootstrap();
