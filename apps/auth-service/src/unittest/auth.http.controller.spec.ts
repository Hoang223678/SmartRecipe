import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@app/contracts';
import { AuthHttpController } from '../api/auth.http.controller';
import { AuthService } from '../auth.service';

describe('AuthHttpController', () => {
  let controller: AuthHttpController;
  let auth: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    me: jest.Mock;
    updateUserRole: jest.Mock;
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
      controllers: [AuthHttpController],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compile();

    controller = module.get(AuthHttpController);
  });

  it('POST /auth/register delegates to service', async () => {
    const dto = {
      email: 'a@b.com',
      password: 'password12',
      displayName: 'A',
    };
    auth.register.mockResolvedValue({ accessToken: 't' });

    await expect(controller.register(dto)).resolves.toEqual({
      accessToken: 't',
    });
    expect(auth.register).toHaveBeenCalledWith(dto);
  });

  it('POST /auth/login forwards user-agent and ip', async () => {
    auth.login.mockResolvedValue({ accessToken: 't' });

    await controller.login(
      { email: 'a@b.com', password: 'password12' },
      { headers: { 'user-agent': 'jest' }, ip: '127.0.0.1' },
    );

    expect(auth.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password12',
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });
  });

  it('POST /auth/refresh delegates refreshToken', async () => {
    auth.refresh.mockResolvedValue({ accessToken: 'new' });
    await controller.refresh({ refreshToken: 'r' });
    expect(auth.refresh).toHaveBeenCalledWith('r');
  });

  it('POST /auth/logout delegates refreshToken', async () => {
    auth.logout.mockResolvedValue({ ok: true });
    await expect(
      controller.logout({ refreshToken: 'r' }),
    ).resolves.toEqual({ ok: true });
  });

  it('GET /auth/me uses jwt sub', async () => {
    auth.me.mockResolvedValue({ id: 'u1' });
    await controller.me({
      sub: 'u1',
      email: 'a@b.com',
      role: Role.USER,
    });
    expect(auth.me).toHaveBeenCalledWith('u1');
  });

  it('PUT /users/:id updates role as actor', async () => {
    auth.updateUserRole.mockResolvedValue({ role: Role.CHEF });
    await controller.updateRole(
      'user-1',
      { role: Role.CHEF },
      { sub: 'admin-1', email: 'admin@x.com', role: Role.ADMIN },
    );
    expect(auth.updateUserRole).toHaveBeenCalledWith(
      'user-1',
      Role.CHEF,
      'admin-1',
    );
  });

  it('fails when login service rejects invalid credentials', async () => {
    auth.login.mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      controller.login(
        { email: 'a@b.com', password: 'badpass1' },
        { headers: {} },
      ),
    ).rejects.toThrow('Invalid credentials');
  });
});
