import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { AuthUser } from './decorators/current-user.decorator';

const BCRYPT_ROUNDS = 12;

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  csrfToken: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

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
    // Hash a dummy when user is missing to keep response time uniform.
    const passwordHash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalididuMjbXl4S9rJ8Gk6uHcz1eA0gK7K';
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
