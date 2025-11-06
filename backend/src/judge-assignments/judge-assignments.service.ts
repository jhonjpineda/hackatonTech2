import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JudgeAssignment } from '../entities/judge-assignment.entity';
import { User, UserRole } from '../entities/user.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { Team } from '../entities/team.entity';

@Injectable()
export class JudgeAssignmentsService {
  constructor(
    @InjectRepository(JudgeAssignment)
    private judgeAssignmentRepository: Repository<JudgeAssignment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Hackathon)
    private hackathonRepository: Repository<Hackathon>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  async assignJudgeToHackathon(
    juezId: string,
    hackathonId: string,
    teamIds?: string[],
  ): Promise<JudgeAssignment> {
    // Verificar que el usuario sea un juez
    const juez = await this.userRepository.findOne({ where: { id: juezId } });
    if (!juez) {
      throw new NotFoundException('Juez no encontrado');
    }
    if (juez.role !== UserRole.JUEZ) {
      throw new BadRequestException('El usuario no tiene rol de JUEZ');
    }

    // Verificar que el hackathon existe
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon no encontrado');
    }

    // Verificar si ya existe una asignación activa
    const existingAssignment = await this.judgeAssignmentRepository.findOne({
      where: {
        juezId,
        hackathonId,
        activo: true,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'El juez ya está asignado a este hackathon',
      );
    }

    // Determinar si puede ver todos los equipos o solo algunos
    const canSeeAllTeams = !teamIds || teamIds.length === 0;

    // Crear la asignación
    const assignment = this.judgeAssignmentRepository.create({
      juezId,
      hackathonId,
      canSeeAllTeams,
      activo: true,
    });

    // Si se especificaron equipos, verificarlos y asignarlos
    if (teamIds && teamIds.length > 0) {
      const teams = await this.teamRepository.find({
        where: { id: In(teamIds) },
        relations: ['category'],
      });

      if (teams.length !== teamIds.length) {
        throw new BadRequestException('Algunos equipos no fueron encontrados');
      }

      // Verificar que todos los equipos pertenecen al hackathon
      const invalidTeams = teams.filter(
        (team) => team.category.hackathonId !== hackathonId,
      );

      if (invalidTeams.length > 0) {
        throw new BadRequestException(
          'Algunos equipos no pertenecen al hackathon especificado',
        );
      }

      assignment.assignedTeams = teams;
    }

    return await this.judgeAssignmentRepository.save(assignment);
  }

  async getJudgeAssignments(juezId: string): Promise<JudgeAssignment[]> {
    return await this.judgeAssignmentRepository.find({
      where: { juezId, activo: true },
      relations: ['hackathon', 'assignedTeams', 'assignedTeams.category'],
    });
  }

  async getHackathonJudges(hackathonId: string): Promise<JudgeAssignment[]> {
    return await this.judgeAssignmentRepository.find({
      where: { hackathonId, activo: true },
      relations: ['juez', 'assignedTeams'],
    });
  }

  async updateJudgeAssignment(
    assignmentId: string,
    teamIds?: string[],
  ): Promise<JudgeAssignment> {
    const assignment = await this.judgeAssignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['assignedTeams'],
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // Actualizar equipos asignados
    if (teamIds !== undefined) {
      if (teamIds.length === 0) {
        assignment.canSeeAllTeams = true;
        assignment.assignedTeams = [];
      } else {
        const teams = await this.teamRepository.find({
          where: { id: In(teamIds) },
          relations: ['category'],
        });

        if (teams.length !== teamIds.length) {
          throw new BadRequestException(
            'Algunos equipos no fueron encontrados',
          );
        }

        // Verificar que todos los equipos pertenecen al hackathon
        const invalidTeams = teams.filter(
          (team) => team.category.hackathonId !== assignment.hackathonId,
        );

        if (invalidTeams.length > 0) {
          throw new BadRequestException(
            'Algunos equipos no pertenecen al hackathon de la asignación',
          );
        }

        assignment.canSeeAllTeams = false;
        assignment.assignedTeams = teams;
      }
    }

    return await this.judgeAssignmentRepository.save(assignment);
  }

  async removeJudgeAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.judgeAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    assignment.activo = false;
    await this.judgeAssignmentRepository.save(assignment);
  }

  async canJudgeAccessSubmission(
    juezId: string,
    teamId: string,
  ): Promise<boolean> {
    // Obtener el equipo con su categoría
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['category'],
    });

    if (!team) {
      return false;
    }

    const hackathonId = team.category.hackathonId;

    // Buscar asignación del juez para este hackathon
    const assignment = await this.judgeAssignmentRepository.findOne({
      where: {
        juezId,
        hackathonId,
        activo: true,
      },
      relations: ['assignedTeams'],
    });

    if (!assignment) {
      return false;
    }

    // Si puede ver todos los equipos, retornar true
    if (assignment.canSeeAllTeams) {
      return true;
    }

    // Verificar si el equipo está en la lista de asignados
    return assignment.assignedTeams.some((t) => t.id === teamId);
  }

  async getAccessibleTeamsForJudge(
    juezId: string,
    hackathonId: string,
  ): Promise<Team[]> {
    const assignment = await this.judgeAssignmentRepository.findOne({
      where: {
        juezId,
        hackathonId,
        activo: true,
      },
      relations: ['assignedTeams', 'assignedTeams.category', 'assignedTeams.miembros'],
    });

    if (!assignment) {
      return [];
    }

    // Si puede ver todos los equipos, obtenerlos todos del hackathon
    if (assignment.canSeeAllTeams) {
      return await this.teamRepository
        .createQueryBuilder('team')
        .leftJoinAndSelect('team.category', 'category')
        .leftJoinAndSelect('team.lider', 'lider')
        .leftJoinAndSelect('team.miembros', 'miembros')
        .where('category.hackathonId = :hackathonId', { hackathonId })
        .andWhere('team.activo = :activo', { activo: true })
        .getMany();
    }

    // Retornar solo los equipos asignados
    return assignment.assignedTeams;
  }
}
