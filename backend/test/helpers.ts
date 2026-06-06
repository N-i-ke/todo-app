import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';

import { AppModule } from '../src/app.module';
import { CsrfGuard } from '../src/auth/guards/csrf.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

// supertest's published types are narrower than Node's http.Server, but at
// runtime `app.getHttpServer()` is exactly what supertest expects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TestServer = any;

/**
 * Boot a Nest app for e2e tests with the same global wiring as production
 * but with throttling disabled so a single test run does not get rate-
 * limited.
 */
export async function bootstrapTestApp() {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new CsrfGuard(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  const server: TestServer = app.getHttpServer();
  const prisma = app.get(PrismaService);

  return { app, server, prisma };
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  // Order matters: delete child rows first.
  await prisma.todo.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Extract cookie value by name from a Set-Cookie header array.
 */
export function getCookie(setCookie: string | string[] | undefined, name: string): string | null {
  if (!setCookie) return null;
  const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
  const pattern = new RegExp(`^${name}=([^;]+)`);
  for (const entry of entries) {
    const match = pattern.exec(entry);
    if (match) return match[1];
  }
  return null;
}

/**
 * Build a Cookie header from a Set-Cookie response.
 */
export function buildCookieHeader(setCookie: string | string[] | undefined): string {
  if (!setCookie) return '';
  const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
  return entries
    .map((entry) => entry.split(';')[0])
    .filter(Boolean)
    .join('; ');
}
