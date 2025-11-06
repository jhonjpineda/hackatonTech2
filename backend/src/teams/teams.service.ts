import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Hackathon)
    private hackathonRepository: Repository<Hackathon>,
  ) {}

  async create(createTeamDto: CreateTeamDto, userId: string) {
    // Verificar que la categoría existe y cargar sus relaciones
    const category = await this.categoryRepository.findOne({
      where: { id: createTeamDto.categoryId },
      relations: ['hackathon', 'topic'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const hackathon = category.hackathon;

    // Verificar que el usuario existe y cargar sus topics
    const lider = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['interestTopics'],
    });
    if (!lider) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // VALIDACIÓN: El líder debe tener la modalidad SIGA que corresponde a esta categoría
    if (category.topic) {
      if (!lider.interestTopics || lider.interestTopics.length === 0) {
        throw new BadRequestException(
          'No tienes ninguna modalidad SIGA asignada. Debes estar inscrito en un bootcamp de SIGA para participar.',
        );
      }

      const liderTopicId = lider.interestTopics[0].id;
      if (liderTopicId !== category.topicId) {
        throw new BadRequestException(
          `Esta categoría es para la modalidad "${category.topic.nombre}", pero tu modalidad es "${lider.interestTopics[0].nombre}". Solo puedes crear equipos en categorías que coincidan con tu modalidad SIGA.`,
        );
      }
    }

    // Verificar si el usuario ya está en otro equipo de esta categoría
    const existingTeam = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoin('team.miembros', 'miembro')
      .where('team.categoryId = :categoryId', { categoryId: category.id })
      .andWhere('(team.liderId = :userId OR miembro.id = :userId)', { userId })
      .getOne();

    if (existingTeam) {
      throw new BadRequestException(
        'Ya perteneces a un equipo en esta categoría',
      );
    }

    // Verificar límite de equipos en la categoría
    if (category.maxEquipos) {
      const teamsCount = await this.teamRepository.count({
        where: { categoryId: category.id },
      });
      if (teamsCount >= category.maxEquipos) {
        throw new BadRequestException(
          `Se alcanzó el límite de ${category.maxEquipos} equipos para esta categoría`,
        );
      }
    }

    // Crear el equipo
    const team = this.teamRepository.create({
      nombre: createTeamDto.nombre,
      descripcion: createTeamDto.descripcion,
      categoryId: createTeamDto.categoryId,
      liderId: userId,
      codigo: this.generateTeamCode(),
    });

    // Agregar miembros iniciales si se proporcionaron
    if (createTeamDto.miembrosIds && createTeamDto.miembrosIds.length > 0) {
      // Validar que no exceda el máximo
      const totalMembers = createTeamDto.miembrosIds.length + 1; // +1 por el líder
      if (totalMembers > hackathon.maxMiembrosEquipo) {
        throw new BadRequestException(
          `El equipo no puede tener más de ${hackathon.maxMiembrosEquipo} miembros`,
        );
      }

      const miembros = await this.userRepository.find({
        where: { id: In(createTeamDto.miembrosIds) },
        relations: ['interestTopics'],
      });

      if (miembros.length !== createTeamDto.miembrosIds.length) {
        throw new NotFoundException('Algunos usuarios no fueron encontrados');
      }

      // VALIDACIÓN: Todos los miembros deben tener la misma modalidad SIGA
      await this.validateSameTopics(lider, miembros);

      team.miembros = miembros;
    } else {
      team.miembros = [];
    }

    return await this.teamRepository.save(team);
  }

  async findAll() {
    return await this.teamRepository.find({
      relations: ['category', 'lider', 'miembros'],
    });
  }

  async findByCategory(categoryId: string) {
    return await this.teamRepository.find({
      where: { categoryId },
      relations: ['lider', 'miembros'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: ['category', 'category.hackathon', 'lider', 'miembros'],
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, userId: string) {
    const team = await this.findOne(id);

    // Solo el líder puede actualizar el equipo
    if (team.liderId !== userId) {
      throw new ForbiddenException(
        'Solo el líder del equipo puede editar el equipo',
      );
    }

    Object.assign(team, updateTeamDto);
    return await this.teamRepository.save(team);
  }

  async remove(id: string, userId: string) {
    const team = await this.findOne(id);

    // Solo el líder o el organizador pueden eliminar el equipo
    const isLider = team.liderId === userId;
    const isOrganizador = team.category.hackathon.organizadorId === userId;

    if (!isLider && !isOrganizador) {
      throw new ForbiddenException(
        'Solo el líder o el organizador pueden eliminar el equipo',
      );
    }

    await this.teamRepository.remove(team);
  }

  async addMember(teamId: string, addMemberDto: AddMemberDto, userId: string) {
    const team = await this.findOne(teamId);
    const hackathon = team.category.hackathon;

    // Solo el líder puede agregar miembros
    if (team.liderId !== userId) {
      throw new ForbiddenException(
        'Solo el líder del equipo puede agregar miembros',
      );
    }

    // Verificar que el usuario existe y cargar sus topics
    const newMember = await this.userRepository.findOne({
      where: { id: addMemberDto.userId },
      relations: ['interestTopics'],
    });
    if (!newMember) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que el usuario no es el líder
    if (addMemberDto.userId === team.liderId) {
      throw new BadRequestException('El líder ya está en el equipo');
    }

    // Verificar que no esté ya en el equipo
    const isMember = team.miembros.some((m) => m.id === addMemberDto.userId);
    if (isMember) {
      throw new BadRequestException('El usuario ya es miembro del equipo');
    }

    // Verificar límite de miembros
    const currentMembers = team.miembros.length + 1; // +1 por el líder
    if (currentMembers >= hackathon.maxMiembrosEquipo) {
      throw new BadRequestException(
        `El equipo ha alcanzado el límite de ${hackathon.maxMiembrosEquipo} miembros`,
      );
    }

    // Verificar que el usuario no esté en otro equipo de esta categoría
    const otherTeam = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoin('team.miembros', 'miembro')
      .where('team.categoryId = :categoryId', {
        categoryId: team.categoryId,
      })
      .andWhere('team.id != :teamId', { teamId })
      .andWhere('(team.liderId = :userId OR miembro.id = :userId)', {
        userId: addMemberDto.userId,
      })
      .getOne();

    if (otherTeam) {
      throw new BadRequestException(
        'El usuario ya pertenece a otro equipo en esta categoría',
      );
    }

    // VALIDACIÓN: El nuevo miembro debe tener la misma modalidad SIGA que el líder
    const lider = await this.userRepository.findOne({
      where: { id: team.liderId },
      relations: ['interestTopics'],
    });
    await this.validateSameTopics(lider, [newMember]);

    // Agregar el miembro
    team.miembros.push(newMember);
    return await this.teamRepository.save(team);
  }

  async removeMember(teamId: string, memberId: string, userId: string) {
    const team = await this.findOne(teamId);

    // El líder puede remover miembros, o un miembro puede salirse
    const isLider = team.liderId === userId;
    const isSelf = memberId === userId;

    if (!isLider && !isSelf) {
      throw new ForbiddenException(
        'Solo el líder puede remover miembros, o puedes salirte del equipo',
      );
    }

    // No se puede remover al líder
    if (memberId === team.liderId) {
      throw new BadRequestException('No se puede remover al líder del equipo');
    }

    // Verificar que el miembro está en el equipo
    const memberIndex = team.miembros.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) {
      throw new NotFoundException('El usuario no es miembro del equipo');
    }

    // Verificar límite mínimo después de remover
    const hackathon = team.category.hackathon;
    const currentMembers = team.miembros.length + 1; // +1 por el líder
    if (currentMembers - 1 < hackathon.minMiembrosEquipo) {
      throw new BadRequestException(
        `El equipo debe tener al menos ${hackathon.minMiembrosEquipo} miembros`,
      );
    }

    // Remover el miembro
    team.miembros.splice(memberIndex, 1);
    return await this.teamRepository.save(team);
  }

  private generateTeamCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Valida que todos los usuarios tengan la misma modalidad SIGA (topic)
   * En SIGA, cada usuario tiene exactamente UNA modalidad
   */
  private async validateSameTopics(lider: User, miembros: User[]): Promise<void> {
    // Verificar que el líder tenga al menos un topic
    if (!lider.interestTopics || lider.interestTopics.length === 0) {
      throw new BadRequestException(
        'El líder no tiene ninguna modalidad SIGA asignada',
      );
    }

    // En SIGA cada usuario tiene exactamente 1 modalidad
    const liderTopicId = lider.interestTopics[0].id;
    const liderTopicNombre = lider.interestTopics[0].nombre;

    // Verificar que todos los miembros tengan la misma modalidad
    for (const miembro of miembros) {
      if (!miembro.interestTopics || miembro.interestTopics.length === 0) {
        throw new BadRequestException(
          `El usuario ${miembro.nombres} ${miembro.apellidos} no tiene ninguna modalidad SIGA asignada`,
        );
      }

      const miembroTopicId = miembro.interestTopics[0].id;
      const miembroTopicNombre = miembro.interestTopics[0].nombre;

      if (miembroTopicId !== liderTopicId) {
        throw new BadRequestException(
          `Todos los miembros deben tener la misma modalidad SIGA. El líder tiene "${liderTopicNombre}" pero ${miembro.nombres} ${miembro.apellidos} tiene "${miembroTopicNombre}"`,
        );
      }
    }
  }
}
