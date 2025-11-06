import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationChannel } from '../entities/communication-channel.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { CreateCommunicationChannelDto } from './dto/create-communication-channel.dto';
import { UpdateCommunicationChannelDto } from './dto/update-communication-channel.dto';

@Injectable()
export class CommunicationChannelsService {
  constructor(
    @InjectRepository(CommunicationChannel)
    private channelRepository: Repository<CommunicationChannel>,
    @InjectRepository(Hackathon)
    private hackathonRepository: Repository<Hackathon>,
  ) {}

  async create(
    createCommunicationChannelDto: CreateCommunicationChannelDto,
    userId: string,
  ) {
    // Verificar que el hackathon existe y el usuario es el organizador
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: createCommunicationChannelDto.hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon no encontrado');
    }

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para agregar canales a este hackathon',
      );
    }

    const channel = this.channelRepository.create(createCommunicationChannelDto);
    return await this.channelRepository.save(channel);
  }

  async findAll() {
    return await this.channelRepository.find({
      relations: ['hackathon'],
    });
  }

  async findByHackathon(hackathonId: string) {
    return await this.channelRepository.find({
      where: { hackathonId },
      order: { orden: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const channel = await this.channelRepository.findOne({
      where: { id },
      relations: ['hackathon'],
    });

    if (!channel) {
      throw new NotFoundException('Canal de comunicación no encontrado');
    }

    return channel;
  }

  async update(
    id: string,
    updateCommunicationChannelDto: UpdateCommunicationChannelDto,
    userId: string,
  ) {
    const channel = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: channel.hackathonId },
    });

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar este canal',
      );
    }

    Object.assign(channel, updateCommunicationChannelDto);
    return await this.channelRepository.save(channel);
  }

  async remove(id: string, userId: string) {
    const channel = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: channel.hackathonId },
    });

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este canal',
      );
    }

    await this.channelRepository.remove(channel);
  }
}
