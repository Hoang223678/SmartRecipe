import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { SERVICE_NAMES } from '@app/contracts';

interface AuthGrpc {
  register(data: object): Observable<GrpcAuthResponse>;
  login(data: object): Observable<GrpcAuthResponse>;
  refresh(data: object): Observable<GrpcAuthResponse>;
  logout(data: object): Observable<object>;
  getMe(data: object): Observable<GrpcUser>;
  updateUserRole(data: object): Observable<GrpcUser>;
}

export type GrpcUser = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: string;
  status: string;
};

export type GrpcAuthResponse = {
  access_token: string;
  refresh_token: string;
  user: GrpcUser;
};

@Injectable()
export class AuthGrpcClient implements OnModuleInit {
  private svc: AuthGrpc;

  constructor(@Inject(SERVICE_NAMES.AUTH) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.svc = this.client.getService<AuthGrpc>('AuthService');
  }

  register(data: object) {
    return firstValueFrom(this.svc.register(data));
  }

  login(data: object) {
    return firstValueFrom(this.svc.login(data));
  }

  refresh(data: object) {
    return firstValueFrom(this.svc.refresh(data));
  }

  logout(data: object) {
    return firstValueFrom(this.svc.logout(data));
  }

  getMe(data: object) {
    return firstValueFrom(this.svc.getMe(data));
  }

  updateUserRole(data: object) {
    return firstValueFrom(this.svc.updateUserRole(data));
  }
}

export function mapAuth(res: GrpcAuthResponse) {
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    user: mapUser(res.user),
  };
}

export function mapUser(user: GrpcUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarUrl: user.avatar_url || null,
    role: user.role,
    status: user.status,
  };
}
