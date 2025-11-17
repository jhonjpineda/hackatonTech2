import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Evaluation } from '../entities/evaluation.entity';
import { Rubric } from '../entities/rubric.entity';
import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { CacheService } from '../common/cache/cache.service';
import { LoggerService } from '../common/logger/logger.service';

export interface EvaluationProgress {
  totalRubrics: number;
  evaluatedRubrics: number;
  pendingRubrics: number;
  percentageComplete: number;
  evaluations: any[];
}

export interface TeamScoreDetail {
  teamId: string;
  challengeId: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  details: RubricScore[];
  completionStatus: 'complete' | 'incomplete' | 'not_started';
}

export interface RubricScore {
  rubricId: string;
  rubricName: string;
  percentage: number;
  score: number;
  normalizedScore: number;
  weightedScore: number;
  evaluationsCount: number;
  minScore?: number;
  maxScore?: number;
  avgScore?: number;
}

@Injectable()
export class EvaluationsOptimizedService {
  private readonly CACHE_TTL = 300; // 5 minutos
  private readonly LEADERBOARD_CACHE_TTL = 600; // 10 minutos

  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Rubric)
    private rubricRepository: Repository<Rubric>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
    private logger: LoggerService,
  ) {
    this.logger.setContext('EvaluationsOptimizedService');
  }

  /**
   * Crea una nueva evaluación con invalidación de caché
   */
  async create(createEvaluationDto: CreateEvaluationDto, juezId: string) {
    // Verificar que el usuario es un juez
    const juez = await this.userRepository.findOne({ where: { id: juezId } });
    if (!juez || juez.role !== 'JUEZ') {
      throw new ForbiddenException('Solo los jueces pueden crear evaluaciones');
    }

    // Verificar que la rúbrica existe
    const rubric = await this.rubricRepository.findOne({
      where: { id: createEvaluationDto.rubricId },
      relations: ['challenge'],
    });
    if (!rubric) {
      throw new NotFoundException('Rúbrica no encontrada');
    }

    // Verificar que el equipo existe
    const team = await this.teamRepository.findOne({
      where: { id: createEvaluationDto.teamId },
      relations: ['category'],
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

    const saved = await this.evaluationRepository.save(evaluation);

    // Invalidar cachés relacionados
    await this.invalidateEvaluationCaches(
      createEvaluationDto.teamId,
      rubric.challengeId,
      team.category.hackathonId,
    );

    this.logger.log(
      `Nueva evaluación creada: Juez ${juezId} evaluó equipo ${createEvaluationDto.teamId}`,
    );

    return saved;
  }

  /**
   * Obtiene evaluaciones con caché
   */
  async findAll() {
    const cacheKey = 'evaluations:all';
    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.evaluationRepository.find({
          relations: ['rubric', 'team', 'juez'],
        });
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Obtiene evaluaciones de un equipo con caché
   */
  async findByTeam(teamId: string) {
    const cacheKey = `evaluations:team:${teamId}`;
    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.evaluationRepository.find({
          where: { teamId },
          relations: ['rubric', 'juez'],
          order: { createdAt: 'DESC' },
        });
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Obtiene evaluaciones de un juez con caché
   */
  async findByJuez(juezId: string) {
    const cacheKey = `evaluations:juez:${juezId}`;
    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.evaluationRepository.find({
          where: { juezId },
          relations: ['rubric', 'team', 'submission'],
          order: { createdAt: 'DESC' },
        });
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Obtiene evaluaciones de un challenge
   */
  async findByChallenge(challengeId: string) {
    const cacheKey = `evaluations:challenge:${challengeId}`;
    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.evaluationRepository
          .createQueryBuilder('evaluation')
          .leftJoinAndSelect('evaluation.rubric', 'rubric')
          .leftJoinAndSelect('evaluation.team', 'team')
          .leftJoinAndSelect('evaluation.juez', 'juez')
          .where('rubric.challengeId = :challengeId', { challengeId })
          .orderBy('evaluation.createdAt', 'DESC')
          .getMany();
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Obtiene progreso de evaluación de un juez para un equipo
   */
  async getJudgeProgressForTeam(
    juezId: string,
    teamId: string,
    challengeId: string,
  ): Promise<EvaluationProgress> {
    const cacheKey = `evaluation:progress:${juezId}:${teamId}:${challengeId}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Obtener todas las rúbricas del challenge
        const rubrics = await this.rubricRepository.find({
          where: { challengeId },
          order: { orden: 'ASC' },
        });

        // Obtener evaluaciones del juez para este equipo
        const evaluations = await this.evaluationRepository.find({
          where: {
            juezId,
            teamId,
          },
          relations: ['rubric'],
        });

        const evaluatedRubricIds = new Set(
          evaluations.map((e) => e.rubricId),
        );

        return {
          totalRubrics: rubrics.length,
          evaluatedRubrics: evaluatedRubricIds.size,
          pendingRubrics: rubrics.length - evaluatedRubricIds.size,
          percentageComplete:
            rubrics.length > 0
              ? Math.round((evaluatedRubricIds.size / rubrics.length) * 100)
              : 0,
          evaluations: evaluations.map((e) => ({
            rubricId: e.rubricId,
            rubricName: e.rubric.nombre,
            calificacion: e.calificacion,
            comentarios: e.comentarios,
            fechaEvaluacion: e.fechaEvaluacion,
          })),
        };
      },
      60, // 1 minuto para progreso
    );
  }

  /**
   * Calcula puntuación de equipo con optimizaciones y caché
   */
  async getTeamScore(
    teamId: string,
    challengeId: string,
  ): Promise<TeamScoreDetail> {
    const cacheKey = `score:team:${teamId}:challenge:${challengeId}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Obtener todas las rúbricas del reto con una sola query
        const rubrics = await this.rubricRepository.find({
          where: { challengeId },
          order: { orden: 'ASC' },
        });

        if (rubrics.length === 0) {
          return {
            teamId,
            challengeId,
            totalScore: 0,
            maxScore: 100,
            percentageScore: 0,
            details: [],
            completionStatus: 'not_started' as const,
          };
        }

        // Obtener todas las evaluaciones con una sola query optimizada
        const evaluations = await this.evaluationRepository
          .createQueryBuilder('evaluation')
          .leftJoin('evaluation.rubric', 'rubric')
          .where('evaluation.teamId = :teamId', { teamId })
          .andWhere('rubric.challengeId = :challengeId', { challengeId })
          .select([
            'evaluation.id',
            'evaluation.rubricId',
            'evaluation.calificacion',
          ])
          .getMany();

        // Agrupar evaluaciones por rúbrica
        const evaluationsByRubric = new Map<string, number[]>();
        evaluations.forEach((e) => {
          if (!evaluationsByRubric.has(e.rubricId)) {
            evaluationsByRubric.set(e.rubricId, []);
          }
          evaluationsByRubric.get(e.rubricId).push(Number(e.calificacion));
        });

        // Calcular puntuación por rúbrica
        const details: RubricScore[] = rubrics.map((rubric) => {
          const rubricEvaluations = evaluationsByRubric.get(rubric.id) || [];

          if (rubricEvaluations.length === 0) {
            return {
              rubricId: rubric.id,
              rubricName: rubric.nombre,
              percentage: Number(rubric.porcentaje),
              score: 0,
              normalizedScore: 0,
              weightedScore: 0,
              evaluationsCount: 0,
            };
          }

          // Calcular estadísticas
          const avgScore =
            rubricEvaluations.reduce((sum, score) => sum + score, 0) /
            rubricEvaluations.length;
          const minScore = Math.min(...rubricEvaluations);
          const maxScore = Math.max(...rubricEvaluations);

          // Normalizar a escala 0-100
          const normalizedScore =
            ((avgScore - rubric.escalaMinima) /
              (rubric.escalaMaxima - rubric.escalaMinima)) *
            100;

          // Aplicar porcentaje de la rúbrica
          const weightedScore =
            (normalizedScore * Number(rubric.porcentaje)) / 100;

          return {
            rubricId: rubric.id,
            rubricName: rubric.nombre,
            percentage: Number(rubric.porcentaje),
            score: avgScore,
            normalizedScore,
            weightedScore,
            evaluationsCount: rubricEvaluations.length,
            minScore,
            maxScore,
            avgScore,
          };
        });

        // Puntuación total
        const totalScore = details.reduce(
          (sum, d) => sum + (d.weightedScore || 0),
          0,
        );

        // Determinar estado de completitud
        const evaluatedRubrics = details.filter((d) => d.evaluationsCount > 0)
          .length;
        let completionStatus: 'complete' | 'incomplete' | 'not_started';
        if (evaluatedRubrics === 0) {
          completionStatus = 'not_started';
        } else if (evaluatedRubrics === rubrics.length) {
          completionStatus = 'complete';
        } else {
          completionStatus = 'incomplete';
        }

        return {
          teamId,
          challengeId,
          totalScore: Math.round(totalScore * 100) / 100,
          maxScore: 100,
          percentageScore: Math.round(totalScore * 100) / 100,
          details,
          completionStatus,
        };
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Obtiene leaderboard de un hackathon con caché
   */
  async getHackathonLeaderboard(hackathonId: string) {
    const cacheKey = `leaderboard:hackathon:${hackathonId}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Obtener todos los equipos del hackathon con sus categorías y challenges
        const teams = await this.teamRepository
          .createQueryBuilder('team')
          .leftJoinAndSelect('team.category', 'category')
          .leftJoinAndSelect('category.challenges', 'challenge')
          .where('category.hackathonId = :hackathonId', { hackathonId })
          .andWhere('team.status = :status', { status: 'ACTIVE' })
          .getMany();

        // Calcular puntuación para cada equipo
        const leaderboard = await Promise.all(
          teams.map(async (team) => {
            // Si el equipo tiene challenges en su categoría
            const challenges = team.category.challenges || [];

            if (challenges.length === 0) {
              return {
                teamId: team.id,
                teamName: team.nombre,
                categoryName: team.category.nombre,
                totalScore: 0,
                challenges: [],
              };
            }

            // Calcular puntuación por cada challenge
            const challengeScores = await Promise.all(
              challenges.map(async (challenge) => {
                const score = await this.getTeamScore(team.id, challenge.id);
                return {
                  challengeId: challenge.id,
                  challengeName: challenge.titulo,
                  score: score.totalScore,
                  completionStatus: score.completionStatus,
                };
              }),
            );

            // Suma total ponderada por porcentaje de challenge
            const totalScore = challengeScores.reduce(
              (sum, cs) => sum + cs.score,
              0,
            );

            return {
              teamId: team.id,
              teamName: team.nombre,
              categoryName: team.category.nombre,
              totalScore: Math.round(totalScore * 100) / 100,
              challenges: challengeScores,
            };
          }),
        );

        // Ordenar por puntuación descendente
        leaderboard.sort((a, b) => b.totalScore - a.totalScore);

        // Agregar posiciones
        return leaderboard.map((entry, index) => ({
          ...entry,
          position: index + 1,
          medal:
            index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null,
        }));
      },
      this.LEADERBOARD_CACHE_TTL,
    );
  }

  /**
   * Actualiza una evaluación con invalidación de caché
   */
  async update(
    id: string,
    updateEvaluationDto: UpdateEvaluationDto,
    juezId: string,
  ) {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['rubric', 'team', 'team.category'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluación no encontrada');
    }

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

    const updated = await this.evaluationRepository.save(evaluation);

    // Invalidar cachés relacionados
    await this.invalidateEvaluationCaches(
      evaluation.teamId,
      evaluation.rubric.challengeId,
      evaluation.team.category.hackathonId,
    );

    this.logger.log(`Evaluación actualizada: ${id}`);

    return updated;
  }

  /**
   * Elimina una evaluación con invalidación de caché
   */
  async remove(id: string, juezId: string) {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['rubric', 'team', 'team.category'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    // Solo el juez que creó la evaluación puede eliminarla
    if (evaluation.juezId !== juezId) {
      throw new ForbiddenException(
        'Solo puedes eliminar tus propias evaluaciones',
      );
    }

    const teamId = evaluation.teamId;
    const challengeId = evaluation.rubric.challengeId;
    const hackathonId = evaluation.team.category.hackathonId;

    await this.evaluationRepository.remove(evaluation);

    // Invalidar cachés relacionados
    await this.invalidateEvaluationCaches(teamId, challengeId, hackathonId);

    this.logger.log(`Evaluación eliminada: ${id}`);
  }

  /**
   * Invalida todos los cachés relacionados con una evaluación
   */
  private async invalidateEvaluationCaches(
    teamId: string,
    challengeId: string,
    hackathonId: string,
  ) {
    await Promise.all([
      this.cacheService.del(`evaluations:team:${teamId}`),
      this.cacheService.del(`evaluations:challenge:${challengeId}`),
      this.cacheService.del(`score:team:${teamId}:challenge:${challengeId}`),
      this.cacheService.del(`leaderboard:hackathon:${hackathonId}`),
      this.cacheService.delPattern(`evaluation:progress:*:${teamId}:*`),
      this.cacheService.del('evaluations:all'),
    ]);

    this.logger.debug(
      `Cache invalidated for team:${teamId}, challenge:${challengeId}, hackathon:${hackathonId}`,
    );
  }

  /**
   * Limpia toda la caché de evaluaciones
   */
  async clearAllCache() {
    await this.cacheService.delPattern('evaluations:*');
    await this.cacheService.delPattern('score:*');
    await this.cacheService.delPattern('leaderboard:*');
    await this.cacheService.delPattern('evaluation:progress:*');
    this.logger.log('All evaluation caches cleared');
  }
}
