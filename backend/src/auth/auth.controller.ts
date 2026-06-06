import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthUser, CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const isProduction = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 3600_000, limit: 3 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUser }> {
    const result = await this.auth.register(dto.email, dto.password);
    this.writeAuthCookies(res, result.accessToken, result.csrfToken);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUser }> {
    const result = await this.auth.login(dto.email, dto.password);
    this.writeAuthCookies(res, result.accessToken, result.csrfToken);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, accessCookieOptions);
    res.clearCookie(CSRF_COOKIE, csrfCookieOptions);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private writeAuthCookies(res: Response, accessToken: string, csrfToken: string): void {
    const maxAge = Number(process.env.JWT_COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000;
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...accessCookieOptions, maxAge });
    res.cookie(CSRF_COOKIE, csrfToken, { ...csrfCookieOptions, maxAge });
  }
}
