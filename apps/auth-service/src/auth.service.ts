import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import {
  AuthTokensDto,
  Role,
  UserProfileDto,
  UserStatus,
} from '@app/contracts';
import { loadEnv } from '@app/config';
import { EventPublisher } from '@app/messaging';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { OutboxEvent } from './entities/outbox-event.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(AuditLog) private readonly audits: Repository<AuditLog>,
    @InjectRepository(OutboxEvent)
    private readonly outbox: Repository<OutboxEvent>,
    private readonly jwt: JwtService,
    private readonly events: EventPublisher,
  ) {}

  async onModuleInit(): Promise<void> {
    const env = loadEnv();
    const exists = await this.users.findOne({ where: { email: env.ADMIN_EMAIL } });
    if (exists) {
      return;
    }
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
    await this.users.save(
      this.users.create({
        email: env.ADMIN_EMAIL,
        passwordHash,
        displayName: 'System Admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      }),
    );
  }

  async register(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<AuthTokensDto> {
    const email = input.email.toLowerCase();
    const exists = await this.users.findOne({ where: { email } });
    if (exists) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.users.save(
      this.users.create({
        email,
        passwordHash: await bcrypt.hash(input.password, 10),
        displayName: input.displayName,
        role: Role.USER,
        status: UserStatus.ACTIVE,
      }),
    );
    return this.issueTokens(user);
  }

  async login(input: {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthTokensDto> {
    const user = await this.users.findOne({
      where: { email: input.email.toLowerCase() },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Account is banned');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    user.lastLoginAt = new Date();
    await this.users.save(user);
    return this.issueTokens(user, input.userAgent, input.ipAddress);
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash },
      relations: ['user'],
    });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string): Promise<{ ok: boolean }> {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: this.hashToken(refreshToken) },
    });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokens.save(stored);
    }
    return { ok: true };
  }

  async me(userId: string): Promise<UserProfileDto> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfile(user);
  }

  async updateUserRole(
    userId: string,
    role: Role,
    actorId: string,
  ): Promise<UserProfileDto> {
    if (role === Role.GUEST) {
      throw new ForbiddenException('Cannot assign GUEST role');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const previous = user.role;
    user.role = role;
    await this.users.save(user);

    await this.audits.save(
      this.audits.create({
        actorId,
        action: 'USER_ROLE_CHANGED',
        targetType: 'user',
        targetId: userId,
        metadata: { previous, role },
      }),
    );

    const event = await this.outbox.save(
      this.outbox.create({
        aggregateType: 'user',
        aggregateId: userId,
        eventType: 'user.role.changed',
        payload: { userId, role, actorId },
      }),
    );
    this.events.userRoleChanged({ userId, role, actorId });
    event.publishedAt = new Date();
    await this.outbox.save(event);

    return this.toProfile(user);
  }

  private async issueTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokensDto> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: 60 * 15 },
    );
    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
      }),
    );
    return {
      accessToken,
      refreshToken,
      user: this.toProfile(user),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
    };
  }
}
