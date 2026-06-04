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

// Real bcrypt hash of a random throw-away string. Used to keep response time
// uniform when the requested email does not exist, so that an attacker cannot
// distinguish "no such user" from "wrong password" via timing.
const DUMMY_PASSWORD_HASH =
  '$2b$12$8FDbcBTym02nVvgwZFeNYui/6GEbf8npTieXIGrF9C2SUYoVr57m.';

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
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
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
