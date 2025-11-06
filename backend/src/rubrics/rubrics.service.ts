import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rubric } from '../entities/rubric.entity';
import { Challenge } from '../entities/challenge.entity';
import { Category } from '../entities/category.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';

@Injectable()
export class RubricsService {
  constructor(
    @InjectRepository(Rubric)
    private rubricRepository: Repository<Rubric>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  async create(createRubricDto: CreateRubricDto, userId: string) {
    // Verificar que el reto existe y el usuario es el organizador
    const challenge = await this.challengeRepository.findOne({
      where: { id: createRubricDto.challengeId },
      relations: ['category', 'category.hackathon'],
    });

    if (!challenge) {
      throw new NotFoundException('Reto no encontrado');
    }

    if (challenge.category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para agregar rúbricas a este reto',
      );
    }

    // Validar que la suma de porcentajes no exceda 100%
    await this.validatePercentageSum(
      createRubricDto.challengeId,
      createRubricDto.porcentaje,
    );

    const rubric = this.rubricRepository.create(createRubricDto);
    return await this.rubricRepository.save(rubric);
  }

  async findAll() {
    return await this.rubricRepository.find({
      relations: ['challenge'],
    });
  }

  async findByChallenge(challengeId: string) {
    return await this.rubricRepository.find({
      where: { challengeId },
      order: { orden: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const rubric = await this.rubricRepository.findOne({
      where: { id },
      relations: ['challenge', 'challenge.category', 'challenge.category.hackathon'],
    });

    if (!rubric) {
      throw new NotFoundException('Rúbrica no encontrada');
    }

    return rubric;
  }

  async update(id: string, updateRubricDto: UpdateRubricDto, userId: string) {
    const rubric = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    if (rubric.challenge.category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar esta rúbrica',
      );
    }

    // Si se actualiza el porcentaje, validar la suma
    if (updateRubricDto.porcentaje !== undefined) {
      await this.validatePercentageSum(
        rubric.challengeId,
        updateRubricDto.porcentaje,
        id,
      );
    }

    Object.assign(rubric, updateRubricDto);
    return await this.rubricRepository.save(rubric);
  }

  async remove(id: string, userId: string) {
    const rubric = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    if (rubric.challenge.category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta rúbrica',
      );
    }

    await this.rubricRepository.remove(rubric);
  }

  async validateRubricsTotal(challengeId: string): Promise<boolean> {
    const rubrics = await this.findByChallenge(challengeId);
    const total = rubrics.reduce(
      (sum, rubric) => sum + Number(rubric.porcentaje),
      0,
    );
    return Math.abs(total - 100) < 0.01; // Tolerancia para decimales
  }

  private async validatePercentageSum(
    challengeId: string,
    newPercentage: number,
    excludeRubricId?: string,
  ) {
    const rubrics = await this.findByChallenge(challengeId);
    const currentSum = rubrics
      .filter((r) => r.id !== excludeRubricId)
      .reduce((sum, rubric) => sum + Number(rubric.porcentaje), 0);

    const newSum = currentSum + newPercentage;

    if (newSum > 100) {
      throw new BadRequestException(
        `La suma de porcentajes excede 100%. Suma actual: ${currentSum}%, intentando agregar: ${newPercentage}%`,
      );
    }
  }
}
