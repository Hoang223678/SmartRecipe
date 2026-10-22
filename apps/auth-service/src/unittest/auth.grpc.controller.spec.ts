import { ConflictException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, UserStatus } from '@app/contracts';
import { AuthGrpcController } from '../api/auth.grpc.controller';
import { AuthService } from '../auth.service';

describe('AuthGrpcController', () => {
  let controller: AuthGrpcController;
  let auth: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    me: jest.Mock;
    updateUserRole: jest.Mock;
  };

  const tokens = {
    accessToken: 'access',
    refreshToken: 'refresh',
    user: {
      id: 'u1',
      email: 'a@b.com',
      displayName: 'A',
      avatarUrl: null,
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  };

  beforeEach(async () => {
    auth = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
      updateUserRole: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthGrpcController],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compile();
    controller = module.get(AuthGrpcController);
  });

  it('Register maps snake_case response', async () => {
    auth.register.mockResolvedValue(tokens);
    await expect(
      controller.register({
        email: 'a@b.com',
        password: 'password12',
        display_name: 'A',
      }),
    ).resolves.toMatchObject({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { display_name: 'A', id: 'u1' },
    });
  });

  it('Register fails and wraps ConflictException as RpcException', async () => {
    auth.register.mockRejectedValue(
      new ConflictException('Email already registered'),
    );

    await expect(
      controller.register({
        email: 'a@b.com',
        password: 'password12',
        display_name: 'A',
      }),
    ).rejects.toBeInstanceOf(RpcException);
  });

  it('Login maps to grpc auth payload', async () => {
    auth.login.mockResolvedValue(tokens);
    await controller.login({ email: 'a@b.com', password: 'password12' });
    expect(auth.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password12',
      userAgent: undefined,
      ipAddress: undefined,
    });
  });

  it('Refresh / Logout / GetMe / UpdateUserRole delegate', async () => {
    auth.refresh.mockResolvedValue(tokens);
    auth.logout.mockResolvedValue({ ok: true });
    auth.me.mockResolvedValue(tokens.user);
    auth.updateUserRole.mockResolvedValue({ ...tokens.user, role: Role.CHEF });

    await controller.refresh({ refresh_token: 'r' });
    await expect(
      controller.logout({ refresh_token: 'r' }),
    ).resolves.toEqual({});
    await controller.getMe({ user_id: 'u1' });
    await controller.updateUserRole({
      user_id: 'u1',
      role: Role.CHEF,
      actor_id: 'admin',
    });

    expect(auth.refresh).toHaveBeenCalledWith('r');
    expect(auth.logout).toHaveBeenCalledWith('r');
    expect(auth.me).toHaveBeenCalledWith('u1');
    expect(auth.updateUserRole).toHaveBeenCalledWith(
      'u1',
      Role.CHEF,
      'admin',
    );
  });
});
