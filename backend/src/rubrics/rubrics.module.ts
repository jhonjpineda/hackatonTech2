import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RubricsService } from './rubrics.service';
import { RubricsController } from './rubrics.controller';
import { Rubric } from '../entities/rubric.entity';
import { Challenge } from '../entities/challenge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rubric, Challenge])],
  controllers: [RubricsController],
  providers: [RubricsService],
  exports: [RubricsService],
})
export class RubricsModule {}
