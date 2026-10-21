import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { EventPublisher } from '@app/messaging';
import { Role, UserStatus } from '@app/contracts';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { OutboxEvent } from './entities/outbox-event.entity';

type MockRepo = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
};

function mockRepo(): MockRepo {
  return {
    findOne: jest.fn(),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    googleId: null,
    displayName: 'User One',
    avatarUrl: null,
    role: Role.USER,
    status: UserStatus.ACTIVE,
    banReason: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let users: MockRepo;
  let refreshTokens: MockRepo;
  let audits: MockRepo;
  let outbox: MockRepo;
  let jwt: { signAsync: jest.Mock };
  let events: { userRoleChanged: jest.Mock };

  beforeEach(async () => {
    users = mockRepo();
    refreshTokens = mockRepo();
    audits = mockRepo();
    outbox = mockRepo();
    jwt = { signAsync: jest.fn().mockResolvedValue('access.jwt') };
    events = { userRoleChanged: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokens },
        { provide: getRepositoryToken(AuditLog), useValue: audits },
        { provide: getRepositoryToken(OutboxEvent), useValue: outbox },
        { provide: JwtService, useValue: jwt },
        { provide: EventPublisher, useValue: events },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('POST /auth/register', () => {
    it('creates USER and returns tokens', async () => {
      users.findOne.mockResolvedValue(null);
      users.save.mockImplementation(async (u: User) => ({
        ...u,
        id: 'new-id',
      }));

      const result = await service.register({
        email: 'New@Example.com',
        password: 'password12',
        displayName: 'New User',
      });

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          displayName: 'New User',
          role: Role.USER,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(result.accessToken).toBe('access.jwt');
      expect(result.refreshToken).toHaveLength(96);
      expect(result.user.email).toBe('new@example.com');
      expect(refreshTokens.save).toHaveBeenCalled();
    });

    it('fails when email already registered', async () => {
      users.findOne.mockResolvedValue(makeUser());

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'password12',
          displayName: 'Dup',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('POST /auth/login', () => {
    it('returns tokens when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('password12', 10);
      users.findOne.mockResolvedValue(makeUser({ passwordHash }));

      const result = await service.login({
        email: 'user@example.com',
        password: 'password12',
      });

      expect(result.accessToken).toBe('access.jwt');
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });

    it('fails with invalid credentials when user is missing', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'password12' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('fails with invalid credentials when password is wrong', async () => {
      const passwordHash = await bcrypt.hash('password12', 10);
      users.findOne.mockResolvedValue(makeUser({ passwordHash }));

      await expect(
        service.login({ email: 'user@example.com', password: 'wrongpass' }),
      ).rejects.toMatchObject({
        message: 'Invalid credentials',
      });
    });

    it('fails when account is banned', async () => {
      const passwordHash = await bcrypt.hash('password12', 10);
      users.findOne.mockResolvedValue(
        makeUser({ passwordHash, status: UserStatus.BANNED }),
      );

      await expect(
        service.login({ email: 'user@example.com', password: 'password12' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates refresh token and returns new pair', async () => {
      const user = makeUser();
      refreshTokens.findOne.mockResolvedValue({
        tokenHash: 'hash',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user,
      });

      const result = await service.refresh('raw-refresh');

      expect(result.accessToken).toBe('access.jwt');
      expect(refreshTokens.save).toHaveBeenCalled();
    });

    it('fails when refresh token is unknown', async () => {
      refreshTokens.findOne.mockResolvedValue(null);

      await expect(service.refresh('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('fails when refresh token is expired', async () => {
      refreshTokens.findOne.mockResolvedValue({
        tokenHash: 'hash',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: makeUser(),
      });

      await expect(service.refresh('expired')).rejects.toMatchObject({
        message: 'Invalid refresh token',
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes an active refresh token', async () => {
      const stored = {
        tokenHash: 'hash',
        revokedAt: null,
      };
      refreshTokens.findOne.mockResolvedValue(stored);

      await expect(service.logout('raw-refresh')).resolves.toEqual({ ok: true });
      expect(stored.revokedAt).toBeInstanceOf(Date);
      expect(refreshTokens.save).toHaveBeenCalledWith(stored);
    });

    it('still succeeds when refresh token is already gone (idempotent fail path)', async () => {
      refreshTokens.findOne.mockResolvedValue(null);

      await expect(service.logout('unknown')).resolves.toEqual({ ok: true });
      expect(refreshTokens.save).not.toHaveBeenCalled();
    });
  });

  describe('GET /auth/me', () => {
    it('returns current profile', async () => {
      users.findOne.mockResolvedValue(makeUser({ displayName: 'Me' }));

      await expect(service.me('user-1')).resolves.toMatchObject({
        id: 'user-1',
        displayName: 'Me',
        role: Role.USER,
      });
    });

    it('fails when user does not exist', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('PUT /users/:id', () => {
    it('updates role, writes audit + outbox, publishes event', async () => {
      const user = makeUser({ role: Role.USER });
      users.findOne.mockResolvedValue(user);
      outbox.save.mockImplementation(async (e: OutboxEvent) => e);

      const result = await service.updateUserRole(
        'user-1',
        Role.CHEF,
        'admin-1',
      );

      expect(result.role).toBe(Role.CHEF);
      expect(audits.save).toHaveBeenCalled();
      expect(events.userRoleChanged).toHaveBeenCalledWith({
        userId: 'user-1',
        role: Role.CHEF,
        actorId: 'admin-1',
      });
      expect(outbox.save).toHaveBeenCalledTimes(2);
    });

    it('fails when assigning GUEST role', async () => {
      await expect(
        service.updateUserRole('user-1', Role.GUEST, 'admin-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(users.findOne).not.toHaveBeenCalled();
    });

    it('fails when target user is missing', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserRole('missing', Role.MODERATOR, 'admin-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
