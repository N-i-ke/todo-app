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

type Auth = {
  cookieHeader: string;
  csrfToken: string;
};

async function registerAndGetAuth(
  server: TestServer,
  email: string,
  password: string,
): Promise<Auth> {
  const res = await request(server).post('/auth/register').send({ email, password }).expect(201);
  const setCookie = res.headers['set-cookie'];
  return {
    cookieHeader: buildCookieHeader(setCookie),
    csrfToken: getCookie(setCookie, 'csrf_token') ?? '',
  };
}

describe('Todo (e2e)', () => {
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

  describe('authentication required', () => {
    it('GET /todos without cookie -> 401', async () => {
      await request(server).get('/todos').expect(401);
    });

    it('POST /todos without cookie -> 401', async () => {
      await request(server).post('/todos').send({ title: 'x' }).expect(401);
    });
  });

  describe('CSRF protection', () => {
    let auth: Auth;
    beforeEach(async () => {
      auth = await registerAndGetAuth(server, 'alice@example.com', 'StrongPass123');
    });

    it('POST without X-CSRF-Token returns 403', async () => {
      await request(server)
        .post('/todos')
        .set('Cookie', auth.cookieHeader)
        .send({ title: 'buy milk' })
        .expect(403);
    });

    it('POST with mismatched X-CSRF-Token returns 403', async () => {
      await request(server)
        .post('/todos')
        .set('Cookie', auth.cookieHeader)
        .set('X-CSRF-Token', 'wrong')
        .send({ title: 'buy milk' })
        .expect(403);
    });

    it('POST with valid X-CSRF-Token succeeds', async () => {
      await request(server)
        .post('/todos')
        .set('Cookie', auth.cookieHeader)
        .set('X-CSRF-Token', auth.csrfToken)
        .send({ title: 'buy milk' })
        .expect(201);
    });

    it('GET (safe method) succeeds without CSRF header', async () => {
      await request(server).get('/todos').set('Cookie', auth.cookieHeader).expect(200);
    });
  });

  describe('CRUD as a single user', () => {
    let auth: Auth;
    beforeEach(async () => {
      auth = await registerAndGetAuth(server, 'alice@example.com', 'StrongPass123');
    });

    it('list -> create -> list -> update -> delete', async () => {
      let res = await request(server).get('/todos').set('Cookie', auth.cookieHeader).expect(200);
      expect(res.body).toEqual([]);

      const created = await request(server)
        .post('/todos')
        .set('Cookie', auth.cookieHeader)
        .set('X-CSRF-Token', auth.csrfToken)
        .send({ title: 'buy milk' })
        .expect(201);
      expect(created.body).toMatchObject({ title: 'buy milk', completed: false });

      res = await request(server).get('/todos').set('Cookie', auth.cookieHeader).expect(200);
      expect(res.body).toHaveLength(1);

      const id = created.body.id as number;
      await request(server)
        .patch(`/todos/${id}`)
        .set('Cookie', auth.cookieHeader)
        .set('X-CSRF-Token', auth.csrfToken)
        .send({ completed: true })
        .expect(200)
        .expect((r) => expect(r.body.completed).toBe(true));

      await request(server)
        .delete(`/todos/${id}`)
        .set('Cookie', auth.cookieHeader)
        .set('X-CSRF-Token', auth.csrfToken)
        .expect(204);

      res = await request(server).get('/todos').set('Cookie', auth.cookieHeader).expect(200);
      expect(res.body).toEqual([]);
    });

    it('rejects empty title', async () => {
      await request(server)
        .post('/todos')
        .set('Cookie', auth.cookieHeader)
        .set('X-CSRF-Token', auth.csrfToken)
        .send({ title: '' })
        .expect(400);
    });
  });

  describe('user isolation', () => {
    it('Bob cannot see, update, or delete Alice todos', async () => {
      const alice = await registerAndGetAuth(server, 'alice@example.com', 'StrongPass123');
      const bob = await registerAndGetAuth(server, 'bob@example.com', 'StrongPass123');

      const aliceTodo = await request(server)
        .post('/todos')
        .set('Cookie', alice.cookieHeader)
        .set('X-CSRF-Token', alice.csrfToken)
        .send({ title: "alice's task" })
        .expect(201);

      // Bob's list is empty
      const bobList = await request(server)
        .get('/todos')
        .set('Cookie', bob.cookieHeader)
        .expect(200);
      expect(bobList.body).toEqual([]);

      // Bob trying to patch Alice's todo -> 404 (not 403, to avoid id enumeration)
      await request(server)
        .patch(`/todos/${aliceTodo.body.id}`)
        .set('Cookie', bob.cookieHeader)
        .set('X-CSRF-Token', bob.csrfToken)
        .send({ title: 'hacked' })
        .expect(404);

      // Bob trying to delete Alice's todo -> 404
      await request(server)
        .delete(`/todos/${aliceTodo.body.id}`)
        .set('Cookie', bob.cookieHeader)
        .set('X-CSRF-Token', bob.csrfToken)
        .expect(404);

      // Alice still has her todo intact
      const aliceList = await request(server)
        .get('/todos')
        .set('Cookie', alice.cookieHeader)
        .expect(200);
      expect(aliceList.body).toHaveLength(1);
      expect(aliceList.body[0].title).toBe("alice's task");
    });
  });
});
