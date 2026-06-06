import { Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { TodoModule } from './todo/todo.module';
import { UsersModule } from './users/users.module';

const isTest = process.env.NODE_ENV === 'test';

// Throttling is bypassed in tests so a single e2e suite can issue many
// login/register calls. The per-route @Throttle() limits and the guard
// itself are exercised by dedicated unit tests; running them again in
// every e2e file would just turn into a flaky rate-limit headache.
const throttlerImports: DynamicModule[] = isTest
  ? []
  : [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])];

const throttlerProviders = isTest
  ? []
  : [
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
    ];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ...throttlerImports,
    PrismaModule,
    UsersModule,
    AuthModule,
    TodoModule,
  ],
  providers: [...throttlerProviders],
})
export class AppModule {}
