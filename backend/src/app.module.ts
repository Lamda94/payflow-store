import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { getDatabaseConfig } from './infrastructure/config/database.config';
import { HttpModule } from './infrastructure/http/http.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 100 }] }),
    HttpModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
