import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  LoginRequestDto,
  LogoutRequestDto,
  RefreshRequestDto,
  RegisterRequestDto,
  Role,
  UpdateUserRoleDto,
} from '@app/contracts';
import { CurrentUser, Public, Roles } from '@app/auth-lib';
import type { JwtUser } from '@app/auth-lib';
import { AuthGrpcClient, mapAuth, mapUser } from './auth.grpc-client';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthGrpcClient) {}

  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Tạo tài khoản, mặc định role USER' })
  async register(@Body() dto: RegisterRequestDto) {
    return mapAuth(
      await this.auth.register({
        email: dto.email,
        password: dto.password,
        display_name: dto.displayName,
      }),
    );
  }

  @Public()
  @Post('auth/login')
  @ApiOperation({ summary: 'Đăng nhập, nhận cặp token' })
  async login(
    @Body() dto: LoginRequestDto,
    @Req() req: { headers: Record<string, string | undefined>; ip?: string },
  ) {
    return mapAuth(
      await this.auth.login({
        email: dto.email,
        password: dto.password,
        user_agent: req.headers['user-agent'] ?? '',
        ip_address: req.ip ?? '',
      }),
    );
  }

  @Public()
  @Post('auth/refresh')
  @ApiOperation({ summary: 'Đổi refresh token lấy access token mới' })
  async refresh(@Body() dto: RefreshRequestDto) {
    return mapAuth(
      await this.auth.refresh({ refresh_token: dto.refreshToken }),
    );
  }

  @ApiBearerAuth()
  @Post('auth/logout')
  @ApiOperation({ summary: 'Thu hồi refresh token' })
  async logout(@Body() dto: LogoutRequestDto) {
    await this.auth.logout({ refresh_token: dto.refreshToken });
    return { ok: true };
  }

  @ApiBearerAuth()
  @Get('auth/me')
  @ApiOperation({ summary: 'Lấy hồ sơ hiện tại' })
  async me(@CurrentUser() user: JwtUser) {
    return mapUser(await this.auth.getMe({ user_id: user.sub }));
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Put('users/:id')
  @ApiOperation({ summary: 'Cập nhật role cho một user (Admin)' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: JwtUser,
  ) {
    return mapUser(
      await this.auth.updateUserRole({
        user_id: id,
        role: dto.role,
        actor_id: actor.sub,
      }),
    );
  }
}
