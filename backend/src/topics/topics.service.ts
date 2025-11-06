import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {}

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    // Verificar si ya existe un tema con el mismo código
    const existingTopic = await this.topicRepository.findOne({
      where: { codigo: createTopicDto.codigo },
    });

    if (existingTopic) {
      throw new ConflictException('Ya existe un tema con este código');
    }

    const topic = this.topicRepository.create(createTopicDto);
    return await this.topicRepository.save(topic);
  }

  async findAll(): Promise<Topic[]> {
    return await this.topicRepository.find({
      order: {
        orden: 'ASC',
        nombre: 'ASC',
      },
    });
  }

  async findAllActive(): Promise<Topic[]> {
    return await this.topicRepository.find({
      where: { activo: true },
      order: {
        orden: 'ASC',
        nombre: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException(`Tema con ID ${id} no encontrado`);
    }

    return topic;
  }

  async findByCode(codigo: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { codigo: codigo as any },
    });

    if (!topic) {
      throw new NotFoundException(`Tema con código ${codigo} no encontrado`);
    }

    return topic;
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    const topic = await this.findOne(id);

    // Si se está cambiando el código, verificar que no exista otro tema con ese código
    if (updateTopicDto.codigo && updateTopicDto.codigo !== topic.codigo) {
      const existingTopic = await this.topicRepository.findOne({
        where: { codigo: updateTopicDto.codigo },
      });

      if (existingTopic) {
        throw new ConflictException('Ya existe un tema con este código');
      }
    }

    Object.assign(topic, updateTopicDto);
    return await this.topicRepository.save(topic);
  }

  async remove(id: string): Promise<void> {
    const topic = await this.findOne(id);
    await this.topicRepository.remove(topic);
  }

  async toggleActive(id: string): Promise<Topic> {
    const topic = await this.findOne(id);
    topic.activo = !topic.activo;
    return await this.topicRepository.save(topic);
  }
}
