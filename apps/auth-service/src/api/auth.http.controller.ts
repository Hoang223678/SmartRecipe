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
import { AuthService } from '../auth.service';

@ApiTags('auth')
@Controller()
export class AuthHttpController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Tạo tài khoản, mặc định role USER' })
  register(@Body() dto: RegisterRequestDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('auth/login')
  @ApiOperation({ summary: 'Đăng nhập, nhận cặp token' })
  login(@Body() dto: LoginRequestDto, @Req() req: { headers: Record<string, string | undefined>; ip?: string }) {
    return this.auth.login({
      ...dto,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Public()
  @Post('auth/refresh')
  @ApiOperation({ summary: 'Đổi refresh token lấy access token mới' })
  refresh(@Body() dto: RefreshRequestDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('auth/logout')
  @ApiOperation({ summary: 'Thu hồi refresh token' })
  logout(@Body() dto: LogoutRequestDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('auth/me')
  @ApiOperation({ summary: 'Lấy hồ sơ hiện tại' })
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Put('users/:id')
  @ApiOperation({ summary: 'Cập nhật role cho một user (Admin)' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: JwtUser,
  ) {
    return this.auth.updateUserRole(id, dto.role, actor.sub);
  }
}
