import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Hackathon, HackathonStatus } from '../entities/hackathon.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Registration, RegistrationStatus } from '../entities/registration.entity';
import { Category } from '../entities/category.entity';
import { SigaStatus } from '../entities/user.entity';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';

@Injectable()
export class HackathonsService {
  constructor(
    @InjectRepository(Hackathon)
    private hackathonRepository: Repository<Hackathon>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(
    createHackathonDto: CreateHackathonDto,
    organizadorId: string,
  ): Promise<Hackathon> {
    // Validar fechas
    const fechaInicio = new Date(createHackathonDto.fechaInicio);
    const fechaFin = new Date(createHackathonDto.fechaFin);
    const fechaLimite = new Date(createHackathonDto.fechaLimiteInscripcion);

    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    if (fechaLimite >= fechaInicio) {
      throw new BadRequestException(
        'La fecha límite de inscripción debe ser anterior a la fecha de inicio',
      );
    }

    if (
      createHackathonDto.maxMiembrosEquipo <
      createHackathonDto.minMiembrosEquipo
    ) {
      throw new BadRequestException(
        'El máximo de miembros no puede ser menor al mínimo',
      );
    }

    // Buscar los topics si se proporcionaron
    let topics: Topic[] = [];
    if (createHackathonDto.topicsIds && createHackathonDto.topicsIds.length > 0) {
      topics = await this.topicRepository.find({
        where: { id: In(createHackathonDto.topicsIds) },
      });

      if (topics.length !== createHackathonDto.topicsIds.length) {
        throw new BadRequestException(
          'Uno o más temas proporcionados no existen',
        );
      }
    }

    // Extraer topicsIds del DTO antes de crear el hackathon
    const { topicsIds, ...hackathonData } = createHackathonDto;

    const hackathon = this.hackathonRepository.create({
      ...hackathonData,
      organizadorId,
      topics,
    });

    const savedHackathon = await this.hackathonRepository.save(hackathon);

    // Crear automáticamente una categoría por cada tema seleccionado
    if (topics.length > 0) {
      const categories = topics.map((topic) => {
        return this.categoryRepository.create({
          nombre: topic.nombre,
          descripcion: topic.descripcion,
          icono: topic.icono,
          hackathonId: savedHackathon.id,
          topicId: topic.id,
          activa: true,
        });
      });

      await this.categoryRepository.save(categories);
    }

    return savedHackathon;
  }

  async findAll(filters?: {
    estado?: HackathonStatus;
    publicado?: boolean;
  }): Promise<Hackathon[]> {
    const query = this.hackathonRepository.createQueryBuilder('hackathon');

    if (filters?.estado) {
      query.andWhere('hackathon.estado = :estado', { estado: filters.estado });
    }

    if (filters?.publicado !== undefined) {
      query.andWhere('hackathon.publicado = :publicado', {
        publicado: filters.publicado,
      });
    }

    query.leftJoinAndSelect('hackathon.organizador', 'organizador');
    query.leftJoinAndSelect('hackathon.topics', 'topics');
    query.orderBy('hackathon.fechaInicio', 'DESC');

    return query.getMany();
  }

  async findPublic(): Promise<Hackathon[]> {
    return this.hackathonRepository.find({
      where: { publicado: true },
      relations: ['organizador', 'topics'],
      order: { fechaInicio: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Hackathon> {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id },
      relations: ['organizador', 'topics'],
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon con ID ${id} no encontrado`);
    }

    return hackathon;
  }

  async update(
    id: string,
    updateHackathonDto: UpdateHackathonDto,
    userId: string,
  ): Promise<Hackathon> {
    const hackathon = await this.findOne(id);

    // Verificar que el usuario sea el organizador
    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar este hackathon',
      );
    }

    // Validar fechas si se están actualizando
    if (updateHackathonDto.fechaInicio || updateHackathonDto.fechaFin) {
      const fechaInicio = new Date(
        updateHackathonDto.fechaInicio || hackathon.fechaInicio,
      );
      const fechaFin = new Date(
        updateHackathonDto.fechaFin || hackathon.fechaFin,
      );

      if (fechaFin <= fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio',
        );
      }
    }

    if (updateHackathonDto.fechaLimiteInscripcion) {
      const fechaLimite = new Date(updateHackathonDto.fechaLimiteInscripcion);
      const fechaInicio = new Date(
        updateHackathonDto.fechaInicio || hackathon.fechaInicio,
      );

      if (fechaLimite >= fechaInicio) {
        throw new BadRequestException(
          'La fecha límite de inscripción debe ser anterior a la fecha de inicio',
        );
      }
    }

    Object.assign(hackathon, updateHackathonDto);

    return this.hackathonRepository.save(hackathon);
  }

  async remove(id: string, userId: string): Promise<void> {
    const hackathon = await this.findOne(id);

    // Verificar que el usuario sea el organizador
    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este hackathon',
      );
    }

    await this.hackathonRepository.remove(hackathon);
  }

  async findByOrganizador(organizadorId: string): Promise<Hackathon[]> {
    return this.hackathonRepository.find({
      where: { organizadorId },
      relations: ['organizador'],
      order: { fechaInicio: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    estado: HackathonStatus,
    userId: string,
  ): Promise<Hackathon> {
    const hackathon = await this.findOne(id);

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para cambiar el estado de este hackathon',
      );
    }

    hackathon.estado = estado;
    return this.hackathonRepository.save(hackathon);
  }

  async publish(id: string, userId: string): Promise<Hackathon> {
    const hackathon = await this.findOne(id);

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para publicar este hackathon',
      );
    }

    hackathon.publicado = true;
    if (hackathon.estado === HackathonStatus.DRAFT) {
      hackathon.estado = HackathonStatus.PUBLISHED;
    }

    return this.hackathonRepository.save(hackathon);
  }

  async unpublish(id: string, userId: string): Promise<Hackathon> {
    const hackathon = await this.findOne(id);

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para despublicar este hackathon',
      );
    }

    hackathon.publicado = false;
    return this.hackathonRepository.save(hackathon);
  }

  /**
   * MÉTODOS PARA INSCRIPCIONES Y ELEGIBILIDAD
   */

  /**
   * Verifica si un usuario puede inscribirse en un hackathon
   */
  async checkEligibility(
    hackathonId: string,
    userId: string,
  ): Promise<{
    isEligible: boolean;
    reasons: string[];
    user: User;
    hackathon: Hackathon;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['interestTopics'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hackathon = await this.findOne(hackathonId);

    const reasons: string[] = [];
    let isEligible = true;

    // 1. Verificar que el hackathon esté publicado
    if (!hackathon.publicado) {
      reasons.push('El hackathon no está publicado');
      isEligible = false;
    }

    // 2. Verificar que las inscripciones estén abiertas
    if (!hackathon.inscripcionAbierta) {
      reasons.push('Las inscripciones están cerradas');
      isEligible = false;
    }

    // 3. Verificar que no haya pasado la fecha límite de inscripción
    const now = new Date();
    if (hackathon.fechaLimiteInscripcion < now) {
      reasons.push('La fecha límite de inscripción ha pasado');
      isEligible = false;
    }

    // 4. Verificar estado SIGA si el usuario es de SIGA
    if (user.source === 'SIGA') {
      if (user.sigaStatus === SigaStatus.RECHAZADO) {
        reasons.push('Usuario rechazado en SIGA');
        isEligible = false;
      }
      if (user.sigaStatus === SigaStatus.INHABILITADO) {
        reasons.push('Usuario inhabilitado en SIGA');
        isEligible = false;
      }
      if (!user.isFullyRegistered) {
        reasons.push('Debes completar tu registro antes de inscribirte');
        isEligible = false;
      }
    }

    // 5. Verificar que el usuario tenga al menos un tema de interés en común con el hackathon
    if (!user.interestTopics || user.interestTopics.length === 0) {
      reasons.push('No tienes temas de interés configurados');
      isEligible = false;
    } else {
      const hasMatchingTopic = user.interestTopics.some((userTopic) =>
        hackathon.topics.some((hackTopic) => hackTopic.id === userTopic.id),
      );

      if (!hasMatchingTopic) {
        const hackathonTopicNames = hackathon.topics
          .map((t) => t.nombre)
          .join(', ');
        reasons.push(
          `No tienes temas de interés compatibles. Este hackathon requiere: ${hackathonTopicNames}`,
        );
        isEligible = false;
      }
    }

    // 6. Verificar que el usuario no esté ya inscrito
    const existingRegistration = await this.registrationRepository.findOne({
      where: {
        userId,
        hackathonId,
      },
    });

    if (existingRegistration) {
      if (existingRegistration.status !== RegistrationStatus.CANCELLED) {
        reasons.push('Ya estás inscrito en este hackathon');
        isEligible = false;
      }
    }

    // 7. Verificar límite de participantes si existe
    if (hackathon.maxParticipantes) {
      const registrationCount = await this.registrationRepository.count({
        where: {
          hackathonId,
          status: In([
            RegistrationStatus.APPROVED,
            RegistrationStatus.PENDING,
          ]),
        },
      });

      if (registrationCount >= hackathon.maxParticipantes) {
        reasons.push('El hackathon ha alcanzado el límite de participantes');
        isEligible = false;
      }
    }

    return {
      isEligible,
      reasons,
      user,
      hackathon,
    };
  }

  /**
   * Inscribe a un usuario en un hackathon
   */
  async registerUserToHackathon(
    hackathonId: string,
    userId: string,
  ): Promise<Registration> {
    // Verificar elegibilidad
    const eligibility = await this.checkEligibility(hackathonId, userId);

    if (!eligibility.isEligible) {
      throw new BadRequestException({
        message: 'No cumples con los requisitos para inscribirte',
        reasons: eligibility.reasons,
      });
    }

    // Crear la inscripción
    const registration = this.registrationRepository.create({
      userId,
      hackathonId,
      status: RegistrationStatus.APPROVED, // Aprobación automática
      isEligible: true,
    });

    return this.registrationRepository.save(registration);
  }

  /**
   * Obtiene las inscripciones de un usuario
   */
  async getUserRegistrations(userId: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { userId },
      relations: ['hackathon', 'hackathon.topics', 'hackathon.organizador'],
      order: { registrationDate: 'DESC' },
    });
  }

  /**
   * Obtiene las inscripciones de un hackathon
   */
  async getHackathonRegistrations(
    hackathonId: string,
  ): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { hackathonId },
      relations: ['user', 'user.interestTopics'],
      order: { registrationDate: 'DESC' },
    });
  }

  /**
   * Cancela la inscripción de un usuario en un hackathon
   */
  async cancelRegistration(
    hackathonId: string,
    userId: string,
  ): Promise<Registration> {
    const registration = await this.registrationRepository.findOne({
      where: { hackathonId, userId },
    });

    if (!registration) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('La inscripción ya está cancelada');
    }

    registration.status = RegistrationStatus.CANCELLED;
    return this.registrationRepository.save(registration);
  }

  /**
   * Obtiene los hackathons disponibles para un usuario (elegibles)
   */
  async getAvailableHackathons(userId: string): Promise<
    Array<{
      hackathon: Hackathon;
      isEligible: boolean;
      reasons: string[];
    }>
  > {
    // Obtener hackathons publicados con inscripciones abiertas
    const hackathons = await this.hackathonRepository.find({
      where: {
        publicado: true,
        inscripcionAbierta: true,
      },
      relations: ['organizador', 'topics'],
      order: { fechaInicio: 'DESC' },
    });

    // Verificar elegibilidad para cada hackathon
    const results = await Promise.all(
      hackathons.map(async (hackathon) => {
        const eligibility = await this.checkEligibility(hackathon.id, userId);
        return {
          hackathon,
          isEligible: eligibility.isEligible,
          reasons: eligibility.reasons,
        };
      }),
    );

    return results;
  }

  /**
   * Obtiene estadísticas de inscripciones de un hackathon
   */
  async getHackathonStats(hackathonId: string): Promise<{
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
    cancelledRegistrations: number;
    registrationsByTopic: Array<{ topic: string; count: number }>;
  }> {
    const registrations = await this.getHackathonRegistrations(hackathonId);

    const stats = {
      totalRegistrations: registrations.length,
      approvedRegistrations: registrations.filter(
        (r) => r.status === RegistrationStatus.APPROVED,
      ).length,
      pendingRegistrations: registrations.filter(
        (r) => r.status === RegistrationStatus.PENDING,
      ).length,
      cancelledRegistrations: registrations.filter(
        (r) => r.status === RegistrationStatus.CANCELLED,
      ).length,
      registrationsByTopic: [] as Array<{ topic: string; count: number }>,
    };

    // Contar inscripciones por tema de interés
    const topicCounts = new Map<string, number>();
    registrations.forEach((registration) => {
      if (registration.user.interestTopics) {
        registration.user.interestTopics.forEach((topic) => {
          const count = topicCounts.get(topic.nombre) || 0;
          topicCounts.set(topic.nombre, count + 1);
        });
      }
    });

    stats.registrationsByTopic = Array.from(topicCounts.entries()).map(
      ([topic, count]) => ({
        topic,
        count,
      }),
    );

    return stats;
  }

  /**
   * Crea categorías faltantes para un hackathon que tiene topics pero no categories
   * Útil para hackathons creados antes de la implementación de auto-creación de categorías
   */
  async createMissingCategories(hackathonId: string): Promise<{
    message: string;
    categoriesCreated: number;
  }> {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: ['topics'],
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon no encontrado');
    }

    if (!hackathon.topics || hackathon.topics.length === 0) {
      throw new BadRequestException(
        'El hackathon no tiene temas asociados para crear categorías',
      );
    }

    // Obtener categorías existentes
    const existingCategories = await this.categoryRepository.find({
      where: { hackathonId },
    });

    const existingTopicIds = existingCategories.map((cat) => cat.topicId);

    // Crear categorías solo para los topics que no tienen categoría
    const topicsNeedingCategories = hackathon.topics.filter(
      (topic) => !existingTopicIds.includes(topic.id),
    );

    if (topicsNeedingCategories.length === 0) {
      return {
        message: 'El hackathon ya tiene todas las categorías necesarias',
        categoriesCreated: 0,
      };
    }

    const newCategories = topicsNeedingCategories.map((topic) => {
      return this.categoryRepository.create({
        nombre: topic.nombre,
        descripcion: topic.descripcion,
        icono: topic.icono,
        hackathonId: hackathon.id,
        topicId: topic.id,
        activa: true,
      });
    });

    await this.categoryRepository.save(newCategories);

    return {
      message: `Se crearon ${newCategories.length} categorías exitosamente`,
      categoriesCreated: newCategories.length,
    };
  }
}
