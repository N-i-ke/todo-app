import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';
import { AuthUser } from './decorators/current-user.decorator';

type JwtPayload = { sub: number; email: string };

const cookieExtractor = (req: Request): string | null => {
  const cookies = req?.cookies as Record<string, string> | undefined;
  return cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly users: UsersService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET must be set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email };
  }
}
