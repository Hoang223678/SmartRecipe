import { AuthTokensDto, Role, UserProfileDto } from '@app/contracts';

export interface IAuthService {
  register(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<AuthTokensDto>;
  login(input: {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthTokensDto>;
  refresh(refreshToken: string): Promise<AuthTokensDto>;
  logout(refreshToken: string): Promise<{ ok: boolean }>;
  me(userId: string): Promise<UserProfileDto>;
  updateUserRole(
    userId: string,
    role: Role,
    actorId: string,
  ): Promise<UserProfileDto>;
}
