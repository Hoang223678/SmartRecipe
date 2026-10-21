import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthLibModule } from '@app/auth-lib';
import { GrpcClientsModule } from './grpc.clients';
import { AuthGrpcClient } from './auth.grpc-client';
import { AuthController } from './auth.controller';
import { RecipeGrpcClient } from './recipe.grpc-client';
import { RecipeController } from './recipe.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [
    AuthLibModule,
    GrpcClientsModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
  ],
  controllers: [AuthController, RecipeController, HealthController],
  providers: [
    AuthGrpcClient,
    RecipeGrpcClient,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
