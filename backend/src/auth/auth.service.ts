import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

import { UsersService } from '../users/users.service';
import { AuthUser } from './decorators/current-user.decorator';

const BCRYPT_ROUNDS = 12;

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  csrfToken: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  // Real bcrypt hash of a per-process random secret. Used when the requested
  // email does not exist so bcrypt.compare runs the same KDF and the response
  // time does not leak whether the user is registered. Computed at boot so we
  // never ship a known dummy hash in source.
  private dummyPasswordHash = '';

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    const seed = randomBytes(32).toString('hex');
    this.dummyPasswordHash = await bcrypt.hash(seed, BCRYPT_ROUNDS);
  }

  async register(email: string, password: string): Promise<AuthResult> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.users.findByEmail(normalized);
    if (existing) {
      this.logger.warn(`register conflict for email=${normalized}`);
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.users.create(normalized, passwordHash);
    this.logger.log(`register success userId=${user.id}`);
    return this.issueTokens({ id: user.id, email: user.email });
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalized = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalized);
    const passwordHash = user?.passwordHash ?? this.dummyPasswordHash;
    const ok = await bcrypt.compare(password, passwordHash);
    if (!user || !ok) {
      this.logger.warn(`login failed email=${normalized}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    this.logger.log(`login success userId=${user.id}`);
    return this.issueTokens({ id: user.id, email: user.email });
  }

  private async issueTokens(user: AuthUser): Promise<AuthResult> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    const csrfToken = randomBytes(32).toString('hex');
    return { user, accessToken, csrfToken };
  }
}
