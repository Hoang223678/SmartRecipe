import { DynamicModule, Global, Inject, Injectable, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { ClientProxy } from '@nestjs/microservices';
import { EVENTS } from '@app/contracts';

export const RMQ_EVENTS = 'RMQ_EVENTS';
export const RECOMMENDATION_QUEUE = 'recommendation_queue';

export function rmqClient(name: string, queue: string) {
  return {
    name,
    transport: Transport.RMQ as const,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5673'],
      queue,
      queueOptions: { durable: true },
      persistent: true,
    },
  };
}

@Injectable()
export class EventPublisher {
  constructor(@Inject(RMQ_EVENTS) private readonly client: ClientProxy) {}

  emit(pattern: string, payload: unknown): void {
    this.client.emit(pattern, payload);
  }

  recipeApproved(payload: { recipeId: string; authorId: string }): void {
    this.emit(EVENTS.RECIPE_APPROVED, payload);
  }

  recipeUpdated(payload: { recipeId: string }): void {
    this.emit(EVENTS.RECIPE_UPDATED, payload);
  }

  ratingChanged(payload: {
    recipeId: string;
    avgRating: number;
    ratingCount: number;
  }): void {
    this.emit(EVENTS.RATING_CHANGED, payload);
  }

  favoriteChanged(payload: {
    recipeId: string;
    favoriteCount: number;
    favorited: boolean;
  }): void {
    this.emit(EVENTS.FAVORITE_CHANGED, payload);
  }

  commentCreated(payload: { recipeId: string; commentId: string }): void {
    this.emit(EVENTS.COMMENT_CREATED, payload);
  }

  userDietUpdated(payload: { userId: string }): void {
    this.emit(EVENTS.USER_DIET_UPDATED, payload);
  }

  userRoleChanged(payload: {
    userId: string;
    role: string;
    actorId: string;
  }): void {
    this.emit(EVENTS.USER_ROLE_CHANGED, payload);
  }
}

@Global()
@Module({})
export class MessagingModule {
  static forPublisher(): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        ClientsModule.register([rmqClient(RMQ_EVENTS, RECOMMENDATION_QUEUE)]),
      ],
      providers: [EventPublisher],
      exports: [EventPublisher, ClientsModule],
    };
  }
}
