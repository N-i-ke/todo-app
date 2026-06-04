// Load .env before any module reads process.env (e.g. JwtModule's factory).
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CsrfGuard } from './auth/guards/csrf.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

function requireEnv(name: string, minLength = 0): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  if (minLength > 0 && value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`);
  }
  return value;
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  requireEnv('JWT_SECRET', 32);

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  const origins = parseOrigins(process.env.CORS_ORIGINS) || ['http://localhost:5173'];
  app.enableCors({
    origin: origins.length > 0 ? origins : ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new CsrfGuard(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

bootstrap();
