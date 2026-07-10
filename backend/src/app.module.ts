import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { getDatabaseConfig } from './infrastructure/config/database.config';
import { PersistenceModule } from './infrastructure/persistence/persistence.module';
import { PspModule } from './infrastructure/psp/psp.module';
import { HealthController } from './infrastructure/http/controllers/health.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 100 }] }),
    PersistenceModule,
    PspModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
