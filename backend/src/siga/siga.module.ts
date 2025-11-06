import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SigaController } from './siga.controller';
import { SigaService } from './siga.service';
import { User, Topic } from '../entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Topic]),
  ],
  controllers: [SigaController],
  providers: [SigaService],
  exports: [SigaService],
})
export class SigaModule {}
