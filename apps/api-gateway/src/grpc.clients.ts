import { ClientsModule, Transport } from '@nestjs/microservices';
import { protoPath, SERVICE_NAMES } from '@app/contracts';
import { loadEnv } from '@app/config';

export const GrpcClientsModule = ClientsModule.registerAsync([
  {
    name: SERVICE_NAMES.AUTH,
    useFactory: () => {
      const env = loadEnv();
      return {
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: protoPath('auth.proto'),
          url: env.AUTH_GRPC_URL,
          loader: { keepCase: true },
        },
      };
    },
  },
  {
    name: SERVICE_NAMES.RECIPE,
    useFactory: () => {
      const env = loadEnv();
      return {
        transport: Transport.GRPC,
        options: {
          package: 'recipe',
          protoPath: protoPath('recipe.proto'),
          url: env.RECIPE_GRPC_URL,
          loader: { keepCase: true },
        },
      };
    },
  },
]);
