import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsOptimizedService } from './evaluations-optimized.service';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsOptimizedController } from './evaluations-optimized.controller';
import { Evaluation } from '../entities/evaluation.entity';
import { Rubric } from '../entities/rubric.entity';
import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';
import { Submission } from '../entities/submission.entity';
import { CacheModule } from '../common/cache/cache.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluation, Rubric, Team, User, Submission]),
    CacheModule,
    LoggerModule,
  ],
  controllers: [EvaluationsController, EvaluationsOptimizedController],
  providers: [EvaluationsService, EvaluationsOptimizedService],
  exports: [EvaluationsService, EvaluationsOptimizedService],
})
export class EvaluationsModule {}
