import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, Campista, Topic, UserRole, UserStatus } from '../entities';
import { UserSource, SigaStatus } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterWithSigaDto, CompleteRegistrationDto, VerifyTokenDto } from './dto/register-with-siga.dto';
import { SigaService } from '../siga/siga.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Campista)
    private campistaRepository: Repository<Campista>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sigaService: SigaService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { documento, email, password, nombres, apellidos, telefono } = registerDto;

    // Verificar si el usuario ya existe
    const existingUserByDoc = await this.userRepository.findOne({
      where: { documento },
    });

    if (existingUserByDoc) {
      throw new ConflictException('Ya existe un usuario con este documento');
    }

    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Hash de la contraseña
    const saltRounds = parseInt(this.configService.get('BCRYPT_SALT_ROUNDS') || '10', 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = this.userRepository.create({
      documento,
      email,
      password: hashedPassword,
      nombres,
      apellidos,
      telefono,
      role: UserRole.CAMPISTA,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
    });

    await this.userRepository.save(user);

    // Crear registro de campista
    const campista = this.campistaRepository.create({
      userId: user.id,
    });

    await this.campistaRepository.save(campista);

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { documento, password } = loginDto;

    // Buscar usuario
    const user = await this.userRepository.findOne({
      where: { documento },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['interestTopics'],
      select: {
        id: true,
        documento: true,
        nombres: true,
        apellidos: true,
        email: true,
        role: true,
        status: true,
        telefono: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '30d',
      }),
    ]);

    return {
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const tokens = await this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }

  async logout(userId: string) {
    // Aquí puedes agregar lógica adicional como invalidar tokens en Redis
    // Por ahora solo retornamos éxito
    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * MÉTODOS PARA INTEGRACIÓN CON SIGA
   */

  /**
   * Inicia el registro con SIGA - Paso 1
   * Valida el documento en SIGA y envía token por email
   */
  async registerWithSiga(registerDto: RegisterWithSigaDto) {
    const { documento, fechaExpedicion } = registerDto;

    // Validar documento en SIGA
    const validationResult = await this.sigaService.validateDocument({
      numeroDocumento: documento,
      fechaExpedicion,
    });

    if (!validationResult.isValid) {
      throw new BadRequestException(
        validationResult.reason || 'Documento no válido en SIGA',
      );
    }

    // Verificar si el usuario ya existe
    let user = await this.userRepository.findOne({
      where: { documento },
      relations: ['interestTopics'],
    });

    // Si el usuario ya está completamente registrado
    if (user && user.isFullyRegistered) {
      throw new ConflictException(
        'Ya existe una cuenta asociada a este documento',
      );
    }

    // Si no existe el usuario, creamos el pre-registro
    if (!user && validationResult.user) {
      const sigaUser = validationResult.user;

      // Generar contraseña temporal
      const temporaryPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      // Mapear programa de interés a Topic
      const topic = await this.sigaService.mapProgramaToTopic(
        sigaUser.programaInteres || '',
      );

      user = this.userRepository.create({
        documento: sigaUser.documento,
        email: sigaUser.email,
        password: hashedPassword,
        nombres: sigaUser.nombres,
        apellidos: sigaUser.apellidos,
        telefono: sigaUser.telefono,
        tipoDocumento: sigaUser.tipoDocumento,
        fechaNacimiento: sigaUser.fechaNacimiento
          ? new Date(sigaUser.fechaNacimiento)
          : null,
        fechaExpedicionDocumento: sigaUser.fechaExpedicionDocumento
          ? new Date(sigaUser.fechaExpedicionDocumento)
          : null,
        genero: sigaUser.genero,
        departamentoResidencia: sigaUser.departamentoResidencia,
        municipioResidencia: sigaUser.municipioResidencia,
        sigaPreinscripcionId: sigaUser.sigaPreinscripcionId,
        sigaInscripcionId: sigaUser.sigaInscripcionId,
        sigaStatus: sigaUser.sigaStatus,
        source: UserSource.SIGA,
        isPreRegistered: true,
        isFullyRegistered: false,
        role: UserRole.CAMPISTA,
        status: UserStatus.ACTIVE,
        mustChangePassword: true,
        interestTopics: topic ? [topic] : [],
      });

      await this.userRepository.save(user);

      // Crear registro de campista
      const campista = this.campistaRepository.create({
        userId: user.id,
      });
      await this.campistaRepository.save(campista);
    }

    // Generar token de verificación
    const verificationToken = this.generateVerificationToken();
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24); // 24 horas

    user.verificationToken = verificationToken;
    user.tokenExpiration = tokenExpiration;
    await this.userRepository.save(user);

    // Enviar email con token
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      `${user.nombres} ${user.apellidos}`,
    );

    return {
      message:
        'Se ha enviado un código de verificación a tu correo electrónico',
      email: this.maskEmail(user.email),
    };
  }

  /**
   * Verifica el token de email - Paso 2
   */
  async verifyToken(verifyDto: VerifyTokenDto) {
    const { token } = verifyDto;

    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
      relations: ['interestTopics'],
    });

    if (!user) {
      throw new NotFoundException('Token inválido o expirado');
    }

    if (user.tokenExpiration < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }

    return {
      isValid: true,
      user: {
        documento: user.documento,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        interestTopics: user.interestTopics,
      },
    };
  }

  /**
   * Completa el registro con SIGA - Paso 3
   * El usuario establece su contraseña y opcionalmente selecciona temas de interés
   */
  async completeRegistration(completeDto: CompleteRegistrationDto) {
    const { token, password, interestTopicIds } = completeDto;

    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
      relations: ['interestTopics'],
    });

    if (!user) {
      throw new NotFoundException('Token inválido o expirado');
    }

    if (user.tokenExpiration < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.mustChangePassword = false;
    user.isFullyRegistered = true;
    user.verificationToken = null;
    user.tokenExpiration = null;

    // Si se proporcionaron temas de interés adicionales
    if (interestTopicIds && interestTopicIds.length > 0) {
      const topics = await this.topicRepository.findByIds(interestTopicIds);
      user.interestTopics = topics;
    }

    await this.userRepository.save(user);

    // Enviar email de bienvenida
    await this.emailService.sendWelcomeEmail(
      user.email,
      `${user.nombres} ${user.apellidos}`,
    );

    // Generar tokens de autenticación
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Registro completado exitosamente',
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Reenvía el token de verificación
   */
  async resendVerificationToken(documento: string) {
    const user = await this.userRepository.findOne({
      where: { documento },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.isFullyRegistered) {
      throw new BadRequestException('El usuario ya está registrado');
    }

    // Generar nuevo token
    const verificationToken = this.generateVerificationToken();
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24);

    user.verificationToken = verificationToken;
    user.tokenExpiration = tokenExpiration;
    await this.userRepository.save(user);

    // Reenviar email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      `${user.nombres} ${user.apellidos}`,
    );

    return {
      message: 'Se ha reenviado el código de verificación',
      email: this.maskEmail(user.email),
    };
  }

  /**
   * Genera un token de verificación aleatorio de 6 dígitos
   */
  private generateVerificationToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Genera una contraseña temporal
   */
  private generateTemporaryPassword(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Enmascara un email para privacidad
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername =
      username.substring(0, 2) + '***' + username.substring(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Sincroniza los temas de interés del usuario desde SIGA
   */
  async syncUserTopicsFromSiga(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['interestTopics'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.source !== UserSource.SIGA) {
      throw new BadRequestException('Solo usuarios de SIGA pueden sincronizar temas');
    }

    // Obtener datos de SIGA del usuario
    try {
      const sigaUser = await this.sigaService.getUserByDocumento(user.documento);

      if (sigaUser && sigaUser.programa_interes) {
        // Mapear programa a topic
        const topic = await this.sigaService.mapProgramaToTopic(sigaUser.programa_interes);

        if (topic) {
          if (!user.interestTopics) {
            user.interestTopics = [];
          }

          // Verificar si el tema de SIGA ya existe en la lista
          const sigaTopicIndex = user.interestTopics.findIndex(t => t.id === topic.id);

          if (sigaTopicIndex === -1) {
            // Si no existe, agregarlo al inicio (como tema principal)
            user.interestTopics.unshift(topic);
          } else if (sigaTopicIndex !== 0) {
            // Si existe pero no está en la primera posición, moverlo al inicio
            const [sigaTopic] = user.interestTopics.splice(sigaTopicIndex, 1);
            user.interestTopics.unshift(sigaTopic);
          }
          // Si ya está en la posición 0, no hacer nada

          await this.userRepository.save(user);
        }
      }

      return {
        message: 'Temas de interés sincronizados exitosamente desde SIGA',
        topics: user.interestTopics,
      };
    } catch (error) {
      throw new BadRequestException('Error al sincronizar temas desde SIGA');
    }
  }

  async searchByDocumento(documento: string) {
    const user = await this.userRepository.findOne({
      where: { documento },
      relations: ['interestTopics'],
      select: {
        id: true,
        documento: true,
        nombres: true,
        apellidos: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async createJudge(judgeData: {
    documento: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
  }) {
    // Verificar si el usuario ya existe
    const existingUserByDoc = await this.userRepository.findOne({
      where: { documento: judgeData.documento },
    });

    if (existingUserByDoc) {
      throw new ConflictException('Ya existe un usuario con este documento');
    }

    const existingUserByEmail = await this.userRepository.findOne({
      where: { email: judgeData.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Generar contraseña temporal
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const saltRounds = parseInt(this.configService.get('BCRYPT_SALT_ROUNDS') || '10', 10);
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Crear usuario con rol JUEZ
    const user = this.userRepository.create({
      documento: judgeData.documento,
      email: judgeData.email,
      password: hashedPassword,
      nombres: judgeData.nombres,
      apellidos: judgeData.apellidos,
      telefono: judgeData.telefono,
      role: UserRole.JUEZ,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      source: UserSource.DIRECT,
      isFullyRegistered: true,
    });

    await this.userRepository.save(user);

    // Enviar email con credenciales
    try {
      await this.emailService.sendJudgeCreationEmail(
        judgeData.email,
        judgeData.nombres,
        judgeData.documento,
        tempPassword,
      );
    } catch (error) {
      console.error('Error enviando email al juez:', error);
      // No fallar la creación si el email falla
    }

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      temporaryPassword: tempPassword, // Solo para mostrar al admin
    };
  }

  async getAllJudges() {
    return await this.userRepository.find({
      where: { role: UserRole.JUEZ },
      select: {
        id: true,
        documento: true,
        nombres: true,
        apellidos: true,
        email: true,
        telefono: true,
        status: true,
        createdAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Crear un nuevo organizador (solo ORGANIZADOR puede hacerlo)
   */
  async createOrganizer(organizerData: {
    documento: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
  }) {
    // Verificar si el usuario ya existe
    const existingUserByDoc = await this.userRepository.findOne({
      where: { documento: organizerData.documento },
    });

    if (existingUserByDoc) {
      throw new ConflictException('Ya existe un usuario con este documento');
    }

    const existingUserByEmail = await this.userRepository.findOne({
      where: { email: organizerData.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Generar contraseña temporal
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const saltRounds = parseInt(this.configService.get('BCRYPT_SALT_ROUNDS') || '10', 10);
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Crear usuario con rol ORGANIZADOR
    const user = this.userRepository.create({
      documento: organizerData.documento,
      email: organizerData.email,
      password: hashedPassword,
      nombres: organizerData.nombres,
      apellidos: organizerData.apellidos,
      telefono: organizerData.telefono,
      role: UserRole.ORGANIZADOR,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      source: UserSource.DIRECT,
      isFullyRegistered: true,
    });

    await this.userRepository.save(user);

    // Enviar email con credenciales
    try {
      await this.emailService.sendOrganizerCreationEmail(
        organizerData.email,
        organizerData.nombres,
        organizerData.documento,
        tempPassword,
      );
    } catch (error) {
      console.error('Error enviando email al organizador:', error);
      // No fallar la creación si el email falla
    }

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      temporaryPassword: tempPassword, // Solo para mostrar al admin
    };
  }

  /**
   * Obtener todos los organizadores
   */
  async getAllOrganizers() {
    return await this.userRepository.find({
      where: { role: UserRole.ORGANIZADOR },
      select: {
        id: true,
        documento: true,
        nombres: true,
        apellidos: true,
        email: true,
        telefono: true,
        status: true,
        createdAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateProfile(userId: string, updateData: {
    nombres?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    interestTopicIds?: string[];
  }) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['interestTopics'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Solo permitir actualizar nombres, apellidos, email y teléfono para ORGANIZADOR y JUEZ
    // Los CAMPISTAS solo pueden actualizar temas de interés adicionales
    if (user.role === UserRole.ORGANIZADOR || user.role === UserRole.JUEZ) {
      if (updateData.nombres) user.nombres = updateData.nombres;
      if (updateData.apellidos) user.apellidos = updateData.apellidos;
      if (updateData.email) user.email = updateData.email;
      if (updateData.telefono !== undefined) user.telefono = updateData.telefono;
    }

    // Actualizar temas de interés adicionales (solo para CAMPISTAS)
    if (user.role === UserRole.CAMPISTA && updateData.interestTopicIds && updateData.interestTopicIds.length > 0) {
      const topics = await this.topicRepository.findByIds(updateData.interestTopicIds);
      // Mantener el tema de interés principal de SIGA y agregar los nuevos
      user.interestTopics = [...user.interestTopics, ...topics.filter(
        topic => !user.interestTopics.some(existing => existing.id === topic.id)
      )];
    }

    await this.userRepository.save(user);

    // Retornar el usuario actualizado sin la contraseña
    return this.getCurrentUser(userId);
  }

  async removeInterestTopic(userId: string, topicId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['interestTopics'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Solo campistas pueden eliminar temas
    if (user.role !== UserRole.CAMPISTA) {
      throw new UnauthorizedException('Solo los campistas pueden modificar temas de interés');
    }

    // No permitir eliminar si es el único tema (el de SIGA)
    if (user.interestTopics.length <= 1) {
      throw new UnauthorizedException('No puedes eliminar el tema principal de SIGA');
    }

    // No permitir eliminar el primer tema (el de SIGA)
    const topicIndex = user.interestTopics.findIndex(t => t.id === topicId);
    if (topicIndex === 0) {
      throw new UnauthorizedException('No puedes eliminar el tema principal de SIGA');
    }

    if (topicIndex === -1) {
      throw new NotFoundException('Tema no encontrado en tus intereses');
    }

    // Eliminar el tema
    user.interestTopics = user.interestTopics.filter(t => t.id !== topicId);
    await this.userRepository.save(user);

    return this.getCurrentUser(userId);
  }

  async changePassword(userId: string, currentPassword: string | undefined, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si el usuario NO está obligado a cambiar contraseña, verificar la actual
    if (!user.mustChangePassword && currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Contraseña actual incorrecta');
      }
    }

    // Hash de la nueva contraseña
    const saltRounds = parseInt(this.configService.get('BCRYPT_SALT_ROUNDS') || '10', 10);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y quitar flag de cambio obligatorio
    user.password = hashedPassword;
    user.mustChangePassword = false;
    await this.userRepository.save(user);

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }
}
