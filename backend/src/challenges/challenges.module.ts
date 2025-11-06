import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { Challenge } from '../entities/challenge.entity';
import { Category } from '../entities/category.entity';
import { Hackathon } from '../entities/hackathon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, Category, Hackathon])],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
