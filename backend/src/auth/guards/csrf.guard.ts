import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { CSRF_COOKIE, CSRF_HEADER } from '../auth.constants';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const cookieToken = cookies[CSRF_COOKIE];
    const headerValue = req.headers[CSRF_HEADER];
    const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const a = Buffer.from(cookieToken);
    const b = Buffer.from(headerToken);
    if (!timingSafeEqual(a, b)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
