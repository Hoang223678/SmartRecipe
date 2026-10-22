import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthLibModule } from '@app/auth-lib';
import { MessagingModule } from '@app/messaging';
import { loadEnv } from '@app/config';
import { AuthService } from './auth.service';
import { AuthHttpController } from './api/auth.http.controller';
import { AuthGrpcController } from './api/auth.grpc.controller';
import { HealthController } from './api/health.controller';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { OutboxEvent } from './entities/outbox-event.entity';

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
            'postgresql://postgres:postgres@localhost:5433/auth_db',
          entities: [User, RefreshToken, AuditLog, OutboxEvent],
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature([User, RefreshToken, AuditLog, OutboxEvent]),
  ],
  controllers: [AuthHttpController, AuthGrpcController, HealthController],
  providers: [AuthService],
})
export class AuthModule {}
