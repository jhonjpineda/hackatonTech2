import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationChannelsService } from './communication-channels.service';
import { CommunicationChannelsController } from './communication-channels.controller';
import { CommunicationChannel } from '../entities/communication-channel.entity';
import { Hackathon } from '../entities/hackathon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommunicationChannel, Hackathon])],
  controllers: [CommunicationChannelsController],
  providers: [CommunicationChannelsService],
  exports: [CommunicationChannelsService],
})
export class CommunicationChannelsModule {}
