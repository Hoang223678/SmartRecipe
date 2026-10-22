import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthLibModule } from '@app/auth-lib';
import { loadEnv } from '@app/config';
import { protoPath, SERVICE_NAMES } from '@app/contracts';
import { HealthController } from './api/health.controller';
import { HealthGrpcController } from './api/health.grpc.controller';
import { PlannerHttpController } from './api/planner.http.controller';
import { RecipeCatalogGrpc } from './api/recipe-catalog.grpc';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanEntry } from './entities/meal-plan-entry.entity';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import { RECIPE_CATALOG } from './interface/recipe-catalog.interface';
import { PlannerService } from './planner.service';

const entities = [MealPlan, MealPlanEntry, ShoppingList, ShoppingListItem];

@Module({
  imports: [
    AuthLibModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const env = loadEnv();
        return {
          type: 'postgres' as const,
          url:
            env.DATABASE_URL ??
            'postgresql://postgres:postgres@localhost:5433/planner_db',
          entities,
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
    ClientsModule.registerAsync([
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
    ]),
  ],
  controllers: [
    PlannerHttpController,
    HealthController,
    HealthGrpcController,
  ],
  providers: [
    PlannerService,
    { provide: RECIPE_CATALOG, useClass: RecipeCatalogGrpc },
  ],
})
export class AppModule {}
