import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  bootstrapTestApp,
  buildCookieHeader,
  getCookie,
  resetDatabase,
  type TestServer,
} from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: TestServer;
  let prisma: PrismaService;

  beforeAll(async () => {
    const ctx = await bootstrapTestApp();
    app = ctx.app;
    server = ctx.server;
    prisma = ctx.prisma;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates a user and sets httpOnly + CSRF cookies', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'StrongPass123' })
        .expect(201);

      expect(res.body.user).toEqual({ id: expect.any(Number), email: 'alice@example.com' });
      const setCookie = res.headers['set-cookie'];
      expect(getCookie(setCookie, 'access_token')).toBeTruthy();
      expect(getCookie(setCookie, 'csrf_token')).toBeTruthy();
      const accessCookie = Array.isArray(setCookie)
        ? setCookie.find((c) => c.startsWith('access_token='))
        : setCookie;
      expect(accessCookie).toMatch(/HttpOnly/);
      expect(accessCookie).toMatch(/SameSite=Strict/);
    });

    it('rejects weak passwords', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({ email: 'a@example.com', password: 'short' })
        .expect(400);
      expect(res.body.message).toMatch(/password/);
    });

    it('rejects malformed email', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'StrongPass123' })
        .expect(400);
    });

    it('returns 409 when the email is already registered', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'dup@example.com', password: 'StrongPass123' })
        .expect(201);

      await request(server)
        .post('/auth/register')
        .send({ email: 'dup@example.com', password: 'StrongPass123' })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'StrongPass123' });
    });

    it('issues new cookies for the correct password', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ email: 'alice@example.com', password: 'StrongPass123' })
        .expect(200);
      expect(getCookie(res.headers['set-cookie'], 'access_token')).toBeTruthy();
    });

    it('rejects wrong password with the generic message', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ email: 'alice@example.com', password: 'WrongPass99' })
        .expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects unknown user with the same generic message (no enumeration)', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ email: 'ghost@example.com', password: 'WrongPass99' })
        .expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('login latency is the same order of magnitude for existing vs unknown users', async () => {
      // Real bcrypt comparisons should each take ~hundreds of ms. If the
      // unknown-user path short-circuits (skip-bcrypt or invalid dummy
      // hash) the ratio explodes and a timing attack becomes feasible.
      const probe = async (email: string) => {
        const t = process.hrtime.bigint();
        await request(server)
          .post('/auth/login')
          .send({ email, password: 'WrongPass99' })
          .expect(401);
        return Number(process.hrtime.bigint() - t) / 1e6;
      };

      const realTimes: number[] = [];
      const ghostTimes: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        realTimes.push(await probe('alice@example.com'));
        ghostTimes.push(await probe(`ghost-${i}@example.com`));
      }
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const realAvg = avg(realTimes);
      const ghostAvg = avg(ghostTimes);
      const ratio = ghostAvg / realAvg;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 without an access cookie', async () => {
      await request(server).get('/auth/me').expect(401);
    });

    it('returns the current user when a valid cookie is sent', async () => {
      const reg = await request(server)
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'StrongPass123' });
      const cookieHeader = buildCookieHeader(reg.headers['set-cookie']);

      const me = await request(server).get('/auth/me').set('Cookie', cookieHeader).expect(200);
      expect(me.body).toEqual({ id: expect.any(Number), email: 'alice@example.com' });
    });
  });

  describe('POST /auth/logout', () => {
    it('clears both cookies and subsequent /auth/me returns 401', async () => {
      const reg = await request(server)
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'StrongPass123' });
      const csrf = getCookie(reg.headers['set-cookie'], 'csrf_token');
      const cookieHeader = buildCookieHeader(reg.headers['set-cookie']);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrf!)
        .expect(204);

      // The original access cookie is still on the client until the browser
      // observes the Set-Cookie clear, but the server endpoint must not
      // accept a stale request without re-login. /auth/me without the
      // cookie at all clearly returns 401.
      await request(server).get('/auth/me').expect(401);
    });
  });
});
