import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from '../entities/challenge.entity';
import { Category } from '../entities/category.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Hackathon)
    private hackathonRepository: Repository<Hackathon>,
  ) {}

  async create(createChallengeDto: CreateChallengeDto, userId: string) {
    // Verificar que la categoría existe
    const category = await this.categoryRepository.findOne({
      where: { id: createChallengeDto.categoryId },
      relations: ['hackathon'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Verificar que el usuario es el organizador del hackathon
    if (category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para agregar retos a esta categoría',
      );
    }

    // Verificar que el porcentaje total no exceda 100%
    await this.validateTotalPercentage(
      createChallengeDto.categoryId,
      createChallengeDto.porcentaje,
    );

    const challenge = this.challengeRepository.create(createChallengeDto);
    return await this.challengeRepository.save(challenge);
  }

  async findAll() {
    return await this.challengeRepository.find({
      relations: ['category'],
    });
  }

  async findByCategory(categoryId: string) {
    return await this.challengeRepository.find({
      where: { categoryId },
      order: { orden: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const challenge = await this.challengeRepository.findOne({
      where: { id },
      relations: ['category', 'category.hackathon'],
    });

    if (!challenge) {
      throw new NotFoundException('Reto no encontrado');
    }

    return challenge;
  }

  async update(
    id: string,
    updateChallengeDto: UpdateChallengeDto,
    userId: string,
  ) {
    const challenge = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    if (challenge.category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este reto');
    }

    // Si se está actualizando el porcentaje, validar
    if (updateChallengeDto.porcentaje !== undefined) {
      await this.validateTotalPercentage(
        challenge.categoryId,
        updateChallengeDto.porcentaje,
        id, // Excluir este reto del cálculo
      );
    }

    Object.assign(challenge, updateChallengeDto);
    return await this.challengeRepository.save(challenge);
  }

  async remove(id: string, userId: string) {
    const challenge = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    if (challenge.category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este reto',
      );
    }

    await this.challengeRepository.remove(challenge);
  }

  async publish(id: string, userId: string) {
    const challenge = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    if (challenge.category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para publicar este reto',
      );
    }

    challenge.estado = 'PUBLISHED' as any;
    return await this.challengeRepository.save(challenge);
  }

  async close(id: string, userId: string) {
    const challenge = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    if (challenge.category.hackathon.organizadorId !== userId) {
      throw new ForbiddenException('No tienes permisos para cerrar este reto');
    }

    challenge.estado = 'CLOSED' as any;
    return await this.challengeRepository.save(challenge);
  }

  /**
   * Valida que el porcentaje total de retos en una categoría no exceda 100%
   */
  private async validateTotalPercentage(
    categoryId: string,
    newPercentage: number,
    excludeChallengeId?: string,
  ): Promise<void> {
    // Obtener todos los retos de la categoría
    const challenges = await this.challengeRepository.find({
      where: { categoryId },
    });

    // Calcular el total actual (excluyendo el reto que se está actualizando si aplica)
    const currentTotal = challenges
      .filter((c) => c.id !== excludeChallengeId)
      .reduce((sum, c) => sum + Number(c.porcentaje || 0), 0);

    const newTotal = currentTotal + Number(newPercentage);

    if (newTotal > 100) {
      throw new BadRequestException(
        `El porcentaje total de los retos no puede exceder 100%. ` +
          `Actualmente tienes ${currentTotal.toFixed(2)}% asignado. ` +
          `Con este reto sería ${newTotal.toFixed(2)}%.`,
      );
    }
  }
}
