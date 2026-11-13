import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthedRequest, RoleName } from './auth.types.js';
import { AuthService } from './auth.service.js';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();

    const header = request.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    const token = value?.startsWith('Bearer ')
      ? value.slice('Bearer '.length).trim()
      : undefined;
    if (!token) throw new UnauthorizedException();

    const session = await this.auth.authenticate(token);
    if (!session) throw new UnauthorizedException();

    const allowed = this.reflector.getAllAndOverride<RoleName[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowed && !allowed.includes(session.user.role)) {
      throw new ForbiddenException();
    }

    request.user = session.user;
    request.session = { id: session.id };
    return true;
  }
}
