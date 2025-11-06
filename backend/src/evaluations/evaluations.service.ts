import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from '../entities/evaluation.entity';
import { Rubric } from '../entities/rubric.entity';
import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Rubric)
    private rubricRepository: Repository<Rubric>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createEvaluationDto: CreateEvaluationDto, juezId: string) {
    // Verificar que el usuario es un juez
    const juez = await this.userRepository.findOne({ where: { id: juezId } });
    if (!juez || juez.role !== 'JUEZ') {
      throw new ForbiddenException('Solo los jueces pueden crear evaluaciones');
    }

    // Verificar que la rúbrica existe
    const rubric = await this.rubricRepository.findOne({
      where: { id: createEvaluationDto.rubricId },
    });
    if (!rubric) {
      throw new NotFoundException('Rúbrica no encontrada');
    }

    // Verificar que el equipo existe
    const team = await this.teamRepository.findOne({
      where: { id: createEvaluationDto.teamId },
    });
    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // Validar que la calificación esté dentro del rango
    if (
      createEvaluationDto.calificacion < rubric.escalaMinima ||
      createEvaluationDto.calificacion > rubric.escalaMaxima
    ) {
      throw new BadRequestException(
        `La calificación debe estar entre ${rubric.escalaMinima} y ${rubric.escalaMaxima}`,
      );
    }

    // Verificar si ya existe una evaluación de este juez para esta rúbrica y equipo
    const existingEvaluation = await this.evaluationRepository.findOne({
      where: {
        rubricId: createEvaluationDto.rubricId,
        teamId: createEvaluationDto.teamId,
        juezId,
      },
    });

    if (existingEvaluation) {
      throw new BadRequestException(
        'Ya has evaluado este equipo con esta rúbrica',
      );
    }

    // Crear la evaluación
    const evaluation = this.evaluationRepository.create({
      ...createEvaluationDto,
      juezId,
      fechaEvaluacion: new Date(),
    });

    return await this.evaluationRepository.save(evaluation);
  }

  async findAll() {
    return await this.evaluationRepository.find({
      relations: ['rubric', 'team', 'juez'],
    });
  }

  async findByTeam(teamId: string) {
    return await this.evaluationRepository.find({
      where: { teamId },
      relations: ['rubric', 'juez'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByJuez(juezId: string) {
    return await this.evaluationRepository.find({
      where: { juezId },
      relations: ['rubric', 'team'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByChallenge(challengeId: string) {
    return await this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.rubric', 'rubric')
      .leftJoinAndSelect('evaluation.team', 'team')
      .leftJoinAndSelect('evaluation.juez', 'juez')
      .where('rubric.challengeId = :challengeId', { challengeId })
      .orderBy('evaluation.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['rubric', 'team', 'juez'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    return evaluation;
  }

  async update(
    id: string,
    updateEvaluationDto: UpdateEvaluationDto,
    juezId: string,
  ) {
    const evaluation = await this.findOne(id);

    // Solo el juez que creó la evaluación puede actualizarla
    if (evaluation.juezId !== juezId) {
      throw new ForbiddenException(
        'Solo puedes actualizar tus propias evaluaciones',
      );
    }

    // Si se actualiza la calificación, validar el rango
    if (updateEvaluationDto.calificacion !== undefined) {
      const rubric = await this.rubricRepository.findOne({
        where: { id: evaluation.rubricId },
      });

      if (
        updateEvaluationDto.calificacion < rubric.escalaMinima ||
        updateEvaluationDto.calificacion > rubric.escalaMaxima
      ) {
        throw new BadRequestException(
          `La calificación debe estar entre ${rubric.escalaMinima} y ${rubric.escalaMaxima}`,
        );
      }
    }

    Object.assign(evaluation, updateEvaluationDto);
    evaluation.fechaEvaluacion = new Date();
    return await this.evaluationRepository.save(evaluation);
  }

  async remove(id: string, juezId: string) {
    const evaluation = await this.findOne(id);

    // Solo el juez que creó la evaluación puede eliminarla
    if (evaluation.juezId !== juezId) {
      throw new ForbiddenException(
        'Solo puedes eliminar tus propias evaluaciones',
      );
    }

    await this.evaluationRepository.remove(evaluation);
  }

  async findBySubmission(submissionId: string) {
    return await this.evaluationRepository.find({
      where: { submissionId },
      relations: ['rubric', 'juez'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTeamScore(teamId: string, challengeId: string) {
    // Obtener todas las rúbricas del reto
    const rubrics = await this.rubricRepository.find({
      where: { challengeId },
    });

    if (rubrics.length === 0) {
      return { teamId, challengeId, score: 0, details: [] };
    }

    // Obtener evaluaciones del equipo para este reto
    const evaluations = await this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.rubric', 'rubric')
      .where('evaluation.teamId = :teamId', { teamId })
      .andWhere('rubric.challengeId = :challengeId', { challengeId })
      .getMany();

    // Calcular puntuación por rúbrica
    const details = rubrics.map((rubric) => {
      const rubricEvaluations = evaluations.filter(
        (e) => e.rubricId === rubric.id,
      );

      if (rubricEvaluations.length === 0) {
        return {
          rubricId: rubric.id,
          rubricName: rubric.nombre,
          percentage: rubric.porcentaje,
          score: 0,
          normalizedScore: 0,
        };
      }

      // Promedio de calificaciones para esta rúbrica
      const avgScore =
        rubricEvaluations.reduce((sum, e) => sum + Number(e.calificacion), 0) /
        rubricEvaluations.length;

      // Normalizar a escala 0-100
      const normalizedScore =
        ((avgScore - rubric.escalaMinima) /
          (rubric.escalaMaxima - rubric.escalaMinima)) *
        100;

      // Aplicar porcentaje
      const weightedScore = (normalizedScore * Number(rubric.porcentaje)) / 100;

      return {
        rubricId: rubric.id,
        rubricName: rubric.nombre,
        percentage: rubric.porcentaje,
        score: avgScore,
        normalizedScore,
        weightedScore,
      };
    });

    // Puntuación total
    const totalScore = details.reduce((sum, d) => sum + (d.weightedScore || 0), 0);

    return {
      teamId,
      challengeId,
      totalScore,
      details,
    };
  }
}
