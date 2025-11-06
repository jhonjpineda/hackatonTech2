import { PartialType } from '@nestjs/swagger';
import { CreateCommunicationChannelDto } from './create-communication-channel.dto';

export class UpdateCommunicationChannelDto extends PartialType(
  CreateCommunicationChannelDto,
) {}
