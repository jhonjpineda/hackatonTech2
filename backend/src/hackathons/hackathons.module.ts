import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HackathonsService } from './hackathons.service';
import { HackathonsController } from './hackathons.controller';
import { Hackathon } from '../entities/hackathon.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Registration } from '../entities/registration.entity';
import { Category } from '../entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hackathon, Topic, User, Registration, Category])],
  controllers: [HackathonsController],
  providers: [HackathonsService],
  exports: [HackathonsService],
})
export class HackathonsModule {}
