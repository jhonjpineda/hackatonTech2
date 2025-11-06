import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { Team } from '../entities/team.entity';
import { Challenge } from '../entities/challenge.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<Submission> {
    const { teamId, challengeId, tecnologias, ...rest } = createSubmissionDto;

    // Verificar que el equipo existe
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['lider', 'miembros', 'category', 'category.hackathon'],
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // Verificar que el usuario es el líder o miembro del equipo
    const isLider = team.liderId === userId;
    const isMember = team.miembros.some((m) => m.id === userId);

    if (!isLider && !isMember) {
      throw new ForbiddenException(
        'Solo los miembros del equipo pueden crear entregas',
      );
    }

    // Verificar que el reto existe
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
      relations: ['category', 'category.hackathon'],
    });

    if (!challenge) {
      throw new NotFoundException('Reto no encontrado');
    }

    // Verificar que el reto pertenece a la misma categoría del equipo
    if (challenge.categoryId !== team.categoryId) {
      throw new BadRequestException(
        'El reto no pertenece a la categoría del equipo',
      );
    }

    // Verificar que no existe una entrega previa del equipo a este reto
    const existingSubmission = await this.submissionRepository.findOne({
      where: {
        teamId,
        challengeId,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException(
        'Ya existe una entrega de este equipo para este reto',
      );
    }

    // Crear la entrega
    const submission = this.submissionRepository.create({
      ...rest,
      teamId,
      challengeId,
      tecnologias: tecnologias ? JSON.stringify(tecnologias) : null,
      status: SubmissionStatus.DRAFT,
    });

    return this.submissionRepository.save(submission);
  }

  async findAll(): Promise<Submission[]> {
    return this.submissionRepository.find({
      relations: ['team', 'challenge', 'evaluations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByChallenge(challengeId: string): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { challengeId },
      relations: ['team', 'team.lider', 'team.miembros', 'evaluations'],
      order: { submittedAt: 'DESC' },
    });
  }

  async findByTeam(teamId: string): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { teamId },
      relations: ['challenge', 'challenge.category', 'evaluations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMySubmissions(userId: string): Promise<Submission[]> {
    // Encontrar todos los equipos donde el usuario es líder o miembro
    const teamsAsLeader = await this.teamRepository.find({
      where: { liderId: userId },
    });

    const teamsAsMember = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoin('team.miembros', 'miembro')
      .where('miembro.id = :userId', { userId })
      .getMany();

    // Combinar todos los equipos
    const allTeams = [...teamsAsLeader, ...teamsAsMember];
    const teamIds = allTeams.map((team) => team.id);

    if (teamIds.length === 0) {
      return [];
    }

    // Obtener todas las entregas de esos equipos
    return this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.team', 'team')
      .leftJoinAndSelect('submission.challenge', 'challenge')
      .leftJoinAndSelect('challenge.category', 'category')
      .leftJoinAndSelect('submission.evaluations', 'evaluations')
      .where('submission.teamId IN (:...teamIds)', { teamIds })
      .orderBy('submission.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: [
        'team',
        'team.lider',
        'team.miembros',
        'challenge',
        'challenge.category',
        'challenge.category.hackathon',
        'evaluations',
        'evaluations.juez',
        'evaluations.rubric',
      ],
    });

    if (!submission) {
      throw new NotFoundException('Entrega no encontrada');
    }

    // Parse tecnologias from JSON string
    if (submission.tecnologias) {
      try {
        (submission as any).tecnologiasArray = JSON.parse(
          submission.tecnologias,
        );
      } catch (e) {
        (submission as any).tecnologiasArray = [];
      }
    }

    return submission;
  }

  async update(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
    userId: string,
  ): Promise<Submission> {
    const submission = await this.findOne(id);

    // Verificar que el usuario es el líder o miembro del equipo
    const isLider = submission.team.liderId === userId;
    const isMember = submission.team.miembros.some((m) => m.id === userId);

    if (!isLider && !isMember) {
      throw new ForbiddenException(
        'Solo los miembros del equipo pueden editar la entrega',
      );
    }

    // No permitir edición si ya está evaluada
    if (submission.status === SubmissionStatus.EVALUATED) {
      throw new BadRequestException('No se puede editar una entrega evaluada');
    }

    const { tecnologias, ...rest } = updateSubmissionDto;

    Object.assign(submission, rest);

    if (tecnologias) {
      submission.tecnologias = JSON.stringify(tecnologias);
    }

    return this.submissionRepository.save(submission);
  }

  async remove(id: string, userId: string): Promise<void> {
    const submission = await this.findOne(id);

    // Verificar que el usuario es el líder del equipo o el organizador
    const isLider = submission.team.liderId === userId;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const isOrganizador = user?.role === UserRole.ORGANIZADOR;

    if (!isLider && !isOrganizador) {
      throw new ForbiddenException(
        'Solo el líder del equipo o el organizador pueden eliminar la entrega',
      );
    }

    // No permitir eliminación si ya está evaluada
    if (submission.status === SubmissionStatus.EVALUATED) {
      throw new BadRequestException(
        'No se puede eliminar una entrega evaluada',
      );
    }

    await this.submissionRepository.remove(submission);
  }

  async submit(id: string, userId: string): Promise<Submission> {
    const submission = await this.findOne(id);

    // Verificar que el usuario es el líder del equipo
    if (submission.team.liderId !== userId) {
      throw new ForbiddenException(
        'Solo el líder del equipo puede enviar la entrega',
      );
    }

    // Verificar que está en borrador
    if (submission.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException('La entrega ya ha sido enviada');
    }

    // Validar que tenga al menos el título, descripción y un link
    if (
      !submission.titulo ||
      !submission.descripcion ||
      (!submission.repositorioUrl &&
        !submission.demoUrl &&
        !submission.videoUrl)
    ) {
      throw new BadRequestException(
        'La entrega debe tener título, descripción y al menos un enlace (repositorio, demo o video)',
      );
    }

    submission.status = SubmissionStatus.SUBMITTED;
    submission.submittedAt = new Date();

    return this.submissionRepository.save(submission);
  }

  async startReview(id: string, userId: string): Promise<Submission> {
    const submission = await this.findOne(id);

    // Verificar que el usuario es juez u organizador
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.role !== UserRole.JUEZ && user?.role !== UserRole.ORGANIZADOR) {
      throw new ForbiddenException(
        'Solo los jueces u organizadores pueden iniciar revisión',
      );
    }

    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new BadRequestException('La entrega no está en estado enviada');
    }

    submission.status = SubmissionStatus.UNDER_REVIEW;
    return this.submissionRepository.save(submission);
  }

  async markAsEvaluated(id: string, userId: string): Promise<Submission> {
    const submission = await this.findOne(id);

    // Verificar que el usuario es juez u organizador
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.role !== UserRole.JUEZ && user?.role !== UserRole.ORGANIZADOR) {
      throw new ForbiddenException(
        'Solo los jueces u organizadores pueden marcar como evaluada',
      );
    }

    if (submission.evaluations.length === 0) {
      throw new BadRequestException(
        'La entrega debe tener al menos una evaluación',
      );
    }

    // Calcular puntaje final (promedio de todas las evaluaciones)
    const totalPuntaje = submission.evaluations.reduce(
      (sum, evaluation) => sum + Number(evaluation.calificacion),
      0,
    );
    submission.puntajeFinal = totalPuntaje / submission.evaluations.length;
    submission.status = SubmissionStatus.EVALUATED;

    return this.submissionRepository.save(submission);
  }

  async getLeaderboard(challengeId: string): Promise<
    Array<{
      submission: Submission;
      team: Team;
      puntajeFinal: number;
      position: number;
    }>
  > {
    const submissions = await this.submissionRepository.find({
      where: {
        challengeId,
        status: SubmissionStatus.EVALUATED,
      },
      relations: ['team', 'team.lider', 'team.miembros'],
      order: { puntajeFinal: 'DESC' },
    });

    return submissions.map((submission, index) => ({
      submission,
      team: submission.team,
      puntajeFinal: Number(submission.puntajeFinal) || 0,
      position: index + 1,
    }));
  }
}
