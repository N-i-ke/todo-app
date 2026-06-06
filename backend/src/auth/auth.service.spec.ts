import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: { findByEmail: jest.Mock; findById: jest.Mock; create: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
    await service.onModuleInit();
  });

  describe('register', () => {
    it('hashes the password, stores the user, and issues tokens', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockImplementation((email, passwordHash) =>
        Promise.resolve({ id: 1, email, passwordHash }),
      );

      const result = await service.register('Alice@Example.com  ', 'StrongPass123');

      expect(users.findByEmail).toHaveBeenCalledWith('alice@example.com');
      const [storedEmail, storedHash] = users.create.mock.calls[0];
      expect(storedEmail).toBe('alice@example.com');
      expect(storedHash).not.toBe('StrongPass123');
      await expect(bcrypt.compare('StrongPass123', storedHash)).resolves.toBe(true);
      expect(result.user).toEqual({ id: 1, email: 'alice@example.com' });
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('throws ConflictException when the email is already registered', async () => {
      users.findByEmail.mockResolvedValue({ id: 1, email: 'a@example.com' });

      await expect(service.register('a@example.com', 'StrongPass123')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const password = 'StrongPass123';
    let storedHash: string;
    beforeEach(async () => {
      storedHash = await bcrypt.hash(password, 4);
    });

    it('succeeds when password matches', async () => {
      users.findByEmail.mockResolvedValue({
        id: 5,
        email: 'alice@example.com',
        passwordHash: storedHash,
      });

      const result = await service.login('alice@example.com', password);

      expect(result.user).toEqual({ id: 5, email: 'alice@example.com' });
      expect(result.accessToken).toBe('signed.jwt.token');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      users.findByEmail.mockResolvedValue({
        id: 5,
        email: 'alice@example.com',
        passwordHash: storedHash,
      });

      await expect(service.login('alice@example.com', 'WrongPass99')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException with the same message for unknown user', async () => {
      users.findByEmail.mockResolvedValue(null);

      const promise = service.login('ghost@example.com', 'WrongPass99');
      await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(promise).rejects.toMatchObject({
        message: 'Invalid email or password',
      });
    });

    it('still runs bcrypt on the dummy path for unknown users', async () => {
      // Detects accidental fast-paths that would re-introduce the
      // user-enumeration timing leak. Threshold is conservative — even
      // bcrypt rounds=4 takes >1ms; rounds=12 takes ~200ms.
      // The strict order-of-magnitude assertion lives in the e2e test.
      users.findByEmail.mockResolvedValue(null);

      const t = process.hrtime.bigint();
      await service.login('ghost@example.com', 'anything').catch(() => undefined);
      const elapsedNs = process.hrtime.bigint() - t;

      expect(elapsedNs).toBeGreaterThan(1_000_000n);
    });
  });
});
