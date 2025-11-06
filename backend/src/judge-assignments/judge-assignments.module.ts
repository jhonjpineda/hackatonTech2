import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JudgeAssignmentsController } from './judge-assignments.controller';
import { JudgeAssignmentsService } from './judge-assignments.service';
import { JudgeAssignment } from '../entities/judge-assignment.entity';
import { User } from '../entities/user.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { Team } from '../entities/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JudgeAssignment, User, Hackathon, Team]),
  ],
  controllers: [JudgeAssignmentsController],
  providers: [JudgeAssignmentsService],
  exports: [JudgeAssignmentsService],
})
export class JudgeAssignmentsModule {}
