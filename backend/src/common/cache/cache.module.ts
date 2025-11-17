import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
