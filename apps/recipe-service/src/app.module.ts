import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthLibModule } from '@app/auth-lib';
import { loadEnv } from '@app/config';
import { HealthController } from './api/health.controller';
import { HealthGrpcController } from './api/health.grpc.controller';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { RecipeTag } from './entities/recipe-tag.entity';
import { RecipeService } from './recipe.service';
import { RecipeHttpController } from './api/recipe.http.controller';
import { RecipeGrpcController } from './api/recipe.grpc.controller';

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
            'postgresql://postgres:postgres@localhost:5433/recipe_db',
          entities: [Recipe, RecipeIngredient, RecipeStep, RecipeTag],
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature([
      Recipe,
      RecipeIngredient,
      RecipeStep,
      RecipeTag,
    ]),
  ],
  controllers: [
    RecipeHttpController,
    RecipeGrpcController,
    HealthController,
    HealthGrpcController,
  ],
  providers: [RecipeService],
})
export class AppModule {}
