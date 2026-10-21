import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY, JwtUser } from './decorators';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: JwtUser;
    }>();

    if (isPublic) {
      this.attachUserIfPresent(request);
      return true;
    }
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing JWT');
    }

    try {
      request.user = this.jwt.verify<JwtUser>(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT');
    }
  }

  private attachUserIfPresent(request: {
    headers: Record<string, string | undefined>;
    user?: JwtUser;
  }): void {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return;
    }
    try {
      request.user = this.jwt.verify<JwtUser>(header.slice(7));
    } catch {
      // Guest browse: token hỏng thì bỏ qua, không chặn API public
    }
  }
}
