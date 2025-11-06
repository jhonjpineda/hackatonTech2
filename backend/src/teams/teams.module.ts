import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team } from '../entities/team.entity';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';
import { Hackathon } from '../entities/hackathon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Category, User, Hackathon])],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
