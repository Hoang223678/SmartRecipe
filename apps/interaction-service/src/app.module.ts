import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthLibModule } from '@app/auth-lib';
import { loadEnv } from '@app/config';
import { MessagingModule } from '@app/messaging';
import { HealthController } from './api/health.controller';
import { HealthGrpcController } from './api/health.grpc.controller';
import { Favorite } from './entities/favorite.entity';
import { Collection } from './entities/collection.entity';
import { CollectionRecipe } from './entities/collection-recipe.entity';
import { Rating } from './entities/rating.entity';
import { Comment } from './entities/comment.entity';
import { Report } from './entities/report.entity';
import { UserMute } from './entities/user-mute.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { InteractionService } from './interaction.service';
import { InteractionHttpController } from './api/interaction.http.controller';

const entities = [
  Favorite,
  Collection,
  CollectionRecipe,
  Rating,
  Comment,
  Report,
  UserMute,
  OutboxEvent,
];

@Module({
  imports: [
    AuthLibModule,
    MessagingModule.forPublisher(),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const env = loadEnv();
        return {
          type: 'postgres' as const,
          url:
            env.DATABASE_URL ??
            'postgresql://postgres:postgres@localhost:5433/interaction_db',
          entities,
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    InteractionHttpController,
    HealthController,
    HealthGrpcController,
  ],
  providers: [InteractionService],
})
export class AppModule {}
