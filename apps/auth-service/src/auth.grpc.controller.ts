import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Role } from '@app/contracts';
import { toRpcException } from '@app/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthGrpcController {
  constructor(private readonly auth: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  async register(data: {
    email: string;
    password: string;
    display_name: string;
  }) {
    try {
      return this.toGrpcAuth(
        await this.auth.register({
          email: data.email,
          password: data.password,
          displayName: data.display_name,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: {
    email: string;
    password: string;
    user_agent?: string;
    ip_address?: string;
  }) {
    try {
      return this.toGrpcAuth(
        await this.auth.login({
          email: data.email,
          password: data.password,
          userAgent: data.user_agent,
          ipAddress: data.ip_address,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'Refresh')
  async refresh(data: { refresh_token: string }) {
    try {
      return this.toGrpcAuth(await this.auth.refresh(data.refresh_token));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: { refresh_token: string }) {
    try {
      await this.auth.logout(data.refresh_token);
      return {};
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'GetMe')
  async getMe(data: { user_id: string }) {
    try {
      return this.toGrpcUser(await this.auth.me(data.user_id));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'UpdateUserRole')
  async updateUserRole(data: {
    user_id: string;
    role: string;
    actor_id: string;
  }) {
    try {
      return this.toGrpcUser(
        await this.auth.updateUserRole(
          data.user_id,
          data.role as Role,
          data.actor_id,
        ),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  private toGrpcAuth(result: Awaited<ReturnType<AuthService['register']>>) {
    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: this.toGrpcUser(result.user),
    };
  }

  private toGrpcUser(user: Awaited<ReturnType<AuthService['me']>>) {
    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl ?? '',
      role: user.role,
      status: user.status,
    };
  }
}
