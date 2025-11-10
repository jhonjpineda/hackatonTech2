import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { User, Topic } from '../entities';
import { UserSource, SigaStatus } from '../entities/user.entity';
import { TopicType } from '../entities/topic.entity';
import { ValidateDocumentDto, SyncUsersDto } from './dto';
import {
  SigaApiResponse,
  SigaAuthResponse,
  SigaReporte1003Response,
  SigaValidationResult,
} from './interfaces/siga-response.interface';

@Injectable()
export class SigaService {
  private readonly logger = new Logger(SigaService.name);
  private sigaToken: string | null = null;
  private tokenExpiration: Date | null = null;
  private authToken: string | null = null;
  private authTokenExpiration: Date | null = null;
  private axiosInstance: AxiosInstance;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {
    // Configurar axios para la API de SIGA
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('SIGA_API_URL'),
      timeout: 30000,
      headers: {
        'User-Agent': 'HackatonTech2-Backend/1.0',
      },
      // Configuración para resolver problemas de DNS en Windows
      family: 4, // Forzar IPv4
    });
  }

  /**
   * Genera token de autenticación en SIGA
   * Endpoint: POST /obtener_token
   * Formato: form-data con client_id y secreto
   */
  async generateToken(): Promise<string> {
    try {
      const clientId = this.configService.get<string>('SIGA_CLIENT_ID');
      const secret = this.configService.get<string>('SIGA_SECRET');

      this.logger.log('Generando token de autenticación SIGA...');

      // Preparar form-data
      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      formData.append('secreto', secret);

      // Llamar al endpoint de SIGA
      const response = await this.axiosInstance.post(
        '/obtener_token',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (!response.data || !response.data.access_token) {
        throw new Error('Respuesta inválida de SIGA: no se recibió access_token');
      }

      this.sigaToken = response.data.access_token;

      // El token expira en 3600 segundos (1 hora)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiration = new Date(Date.now() + expiresIn * 1000);

      this.logger.log('Token SIGA generado exitosamente');
      this.logger.debug(`Token expira en: ${this.tokenExpiration.toISOString()}`);

      return this.sigaToken;
    } catch (error) {
      this.logger.error('Error generando token SIGA:', error.message);
      if (error.response) {
        this.logger.error('Respuesta SIGA:', error.response.data);
      }
      throw new HttpException(
        'Error al autenticar con SIGA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Autentica con usuario y contraseña en SIGA
   * Endpoint: POST /autenticar
   * Formato: Headers (auth_token) + form-data (username, password)
   */
  async authenticate(): Promise<string> {
    try {
      // Primero asegurarnos de tener el access_token
      const accessToken = await this.ensureValidToken();

      const username = this.configService.get<string>('SIGA_USERNAME');
      const password = this.configService.get<string>('SIGA_PASSWORD');

      this.logger.log('Autenticando usuario en SIGA...');

      // Preparar form-data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Llamar al endpoint de autenticación
      const response = await this.axiosInstance.post(
        '/autenticar',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'auth_token': accessToken,
          },
        },
      );

      if (!response.data || (!response.data.TOKEN && !response.data.token)) {
        throw new Error('Respuesta inválida de SIGA: no se recibió token de autenticación');
      }

      // SIGA devuelve TOKEN en mayúsculas
      this.authToken = response.data.TOKEN || response.data.token;

      // Usar el tiempo de expiración que devuelve SIGA (en segundos)
      const expiresInMs = (response.data.EXPIRA_EN || 3600) * 1000;
      this.authTokenExpiration = new Date(Date.now() + expiresInMs);

      this.logger.log('Autenticación SIGA exitosa');
      this.logger.debug(`Auth token expira en: ${this.authTokenExpiration.toISOString()}`);

      return this.authToken;
    } catch (error) {
      this.logger.error('Error autenticando en SIGA:', error.message);
      if (error.response) {
        this.logger.error('Respuesta SIGA:', error.response.data);
      }
      throw new HttpException(
        'Error al autenticar usuario en SIGA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Valida si el token está vigente
   */
  private async ensureValidToken(): Promise<string> {
    if (
      !this.sigaToken ||
      !this.tokenExpiration ||
      this.tokenExpiration < new Date()
    ) {
      return await this.generateToken();
    }
    return this.sigaToken;
  }

  /**
   * Valida si el auth token está vigente y lo genera si es necesario
   */
  private async ensureValidAuthToken(): Promise<string> {
    if (
      !this.authToken ||
      !this.authTokenExpiration ||
      this.authTokenExpiration < new Date()
    ) {
      return await this.authenticate();
    }
    return this.authToken;
  }

  /**
   * Valida un documento contra SIGA
   * Consulta el reporte 1003 y verifica el estado del usuario
   */
  async validateDocument(
    validateDto: ValidateDocumentDto,
  ): Promise<SigaValidationResult> {
    try {
      this.logger.log(`Validando documento en SIGA: ${validateDto.numeroDocumento}`);

      // Obtener información del usuario desde SIGA
      const sigaUser = await this.getUserFromSiga(validateDto.numeroDocumento);

      if (!sigaUser) {
        return {
          isValid: false,
          reason: 'Usuario no encontrado en SIGA',
        };
      }

      // Verificar si la inscripción está aprobada
      const inscripcionAprobada = sigaUser.inscripcion_aprobada?.toUpperCase() === 'APROBADO';

      if (!inscripcionAprobada) {
        return {
          isValid: false,
          reason: 'Inscripción no aprobada en SIGA',
          sigaData: sigaUser,
        };
      }

      // Determinar el status basado en los datos de SIGA
      let sigaStatus: SigaStatus = SigaStatus.APROBADO;

      // Si la inscripción no está aprobada, marcar como rechazado
      if (!inscripcionAprobada) {
        sigaStatus = SigaStatus.RECHAZADO;
      }

      // Verificar si ya existe el usuario en nuestra BD
      let user = await this.userRepository.findOne({
        where: { documento: validateDto.numeroDocumento },
        relations: ['interestTopics'],
      });

      // Si no existe, crear usuario pre-registrado
      if (!user) {
        this.logger.log(`Creando usuario pre-registrado: ${sigaUser.documento_numero}`);

        // Mapear programa de interés a Topic
        const topic = await this.mapProgramaToTopic(sigaUser.programa_interes);

        user = this.userRepository.create({
          documento: sigaUser.documento_numero,
          tipoDocumento: sigaUser.tipo_documento,
          nombres: sigaUser.nombres,
          apellidos: sigaUser.apellidos,
          email: sigaUser.correo_electronico,
          password: '', // Se establecerá cuando complete el registro
          genero: sigaUser.genero,
          departamentoResidencia: sigaUser.departamento,
          municipioResidencia: sigaUser.municipio,
          sigaPreinscripcionId: sigaUser.asp_codigo?.toString(),
          sigaInscripcionId: sigaUser.asp_numero_inscripcion?.toString(),
          sigaStatus,
          source: UserSource.SIGA,
          isPreRegistered: true,
          isFullyRegistered: false,
          interestTopics: topic ? [topic] : [],
        });

        await this.userRepository.save(user);
        this.logger.log(`Usuario pre-registrado creado: ${user.id}`);
      }

      return {
        isValid: true,
        user,
        sigaData: sigaUser,
      };
    } catch (error) {
      this.logger.error('Error validando documento en SIGA:', error.message);
      throw new HttpException(
        'Error al validar documento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sincroniza usuarios desde SIGA (reporte 1003)
   * Trae todos los usuarios del reporte y los crea/actualiza en la BD local
   */
  async syncUsers(syncDto: SyncUsersDto = {}): Promise<{
    synced: number;
    created: number;
    updated: number;
    errors: number;
  }> {
    try {
      // Obtener ambos tokens
      const accessToken = await this.ensureValidToken();
      const authToken = await this.ensureValidAuthToken();

      this.logger.log('Iniciando sincronización de usuarios SIGA...');

      // Obtener todos los usuarios del reporte 1003
      const response = await this.axiosInstance.post(
        '/talentotech2/informacion_reporte_1003',
        {
          soloactivos: syncDto.soloActivos !== undefined ? syncDto.soloActivos : false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'token_autenticacion': authToken,
            'token': accessToken,
          },
        },
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Respuesta inválida de SIGA: se esperaba un array de usuarios');
      }

      let sigaUsers = response.data;
      this.logger.log(`Se obtuvieron ${sigaUsers.length} usuarios de SIGA`);

      // Filtrar solo usuarios aprobados si se solicita
      if (syncDto.onlyApproved) {
        sigaUsers = sigaUsers.filter(
          (user: any) => user.inscripcion_aprobada?.toUpperCase() === 'APROBADO'
        );
        this.logger.log(`Filtrando solo aprobados: ${sigaUsers.length} usuarios aprobados`);
      }

      let created = 0;
      let updated = 0;
      let errors = 0;

      // Procesar cada usuario
      for (const sigaUser of sigaUsers) {
        try {
          // Verificar si el usuario ya existe
          let user = await this.userRepository.findOne({
            where: { documento: sigaUser.documento_numero },
            relations: ['interestTopics'],
          });

          // Determinar status
          const inscripcionAprobada = sigaUser.inscripcion_aprobada?.toUpperCase() === 'APROBADO';
          const sigaStatus = inscripcionAprobada ? SigaStatus.APROBADO : SigaStatus.RECHAZADO;

          // Mapear programa de interés a Topic
          const topic = await this.mapProgramaToTopic(sigaUser.programa_interes);

          if (!user) {
            // Crear nuevo usuario pre-registrado
            user = this.userRepository.create({
              documento: sigaUser.documento_numero,
              tipoDocumento: sigaUser.tipo_documento,
              nombres: sigaUser.nombres,
              apellidos: sigaUser.apellidos,
              email: sigaUser.correo_electronico,
              password: '', // Se establecerá cuando complete el registro
              genero: sigaUser.genero,
              departamentoResidencia: sigaUser.departamento,
              municipioResidencia: sigaUser.municipio,
              sigaPreinscripcionId: sigaUser.asp_codigo?.toString(),
              sigaInscripcionId: sigaUser.asp_numero_inscripcion?.toString(),
              sigaStatus,
              source: UserSource.SIGA,
              isPreRegistered: true,
              isFullyRegistered: false,
              interestTopics: topic ? [topic] : [],
            });

            await this.userRepository.save(user);
            created++;
          } else {
            // Actualizar usuario existente
            user.nombres = sigaUser.nombres;
            user.apellidos = sigaUser.apellidos;
            user.email = sigaUser.correo_electronico;
            user.genero = sigaUser.genero;
            user.departamentoResidencia = sigaUser.departamento;
            user.municipioResidencia = sigaUser.municipio;
            user.sigaPreinscripcionId = sigaUser.asp_codigo?.toString();
            user.sigaInscripcionId = sigaUser.asp_numero_inscripcion?.toString();
            user.sigaStatus = sigaStatus;

            if (topic && !user.interestTopics.some(t => t.id === topic.id)) {
              user.interestTopics.push(topic);
            }

            await this.userRepository.save(user);
            updated++;
          }
        } catch (err) {
          this.logger.error(`Error procesando usuario ${sigaUser.documento_numero}:`, err.message);
          errors++;
        }
      }

      this.logger.log(
        `Sincronización completa: ${created} creados, ${updated} actualizados, ${errors} errores`,
      );

      return {
        synced: created + updated,
        created,
        updated,
        errors,
      };
    } catch (error) {
      this.logger.error('Error sincronizando usuarios de SIGA:', error.message);
      if (error.response) {
        this.logger.error('Respuesta SIGA:', error.response.data);
      }
      throw new HttpException(
        'Error al sincronizar usuarios',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mapea el programa de interés de SIGA a un Topic
   */
  async mapProgramaToTopic(programaInteres: string): Promise<Topic | null> {
    const programaUpper = programaInteres.toUpperCase();

    let topicType: TopicType | null = null;

    if (programaUpper.includes('INTELIGENCIA ARTIFICIAL') || programaUpper.includes('IA')) {
      topicType = TopicType.INTELIGENCIA_ARTIFICIAL;
    } else if (programaUpper.includes('ANALISIS') || programaUpper.includes('DATOS')) {
      topicType = TopicType.ANALISIS_DATOS;
    } else if (programaUpper.includes('PROGRAMACION') || programaUpper.includes('PROG')) {
      topicType = TopicType.PROGRAMACION;
    } else if (programaUpper.includes('BLOCKCHAIN')) {
      topicType = TopicType.BLOCKCHAIN;
    } else if (programaUpper.includes('CIBERSEGURIDAD') || programaUpper.includes('CYBER')) {
      topicType = TopicType.CIBERSEGURIDAD;
    } else if (programaUpper.includes('NUBE') || programaUpper.includes('CLOUD') || programaUpper.includes('ARQUITECTURA')) {
      topicType = TopicType.ARQUITECTURA_NUBE;
    }

    if (!topicType) {
      this.logger.warn(`No se pudo mapear programa: ${programaInteres}`);
      return null;
    }

    const topic = await this.topicRepository.findOne({
      where: { codigo: topicType },
    });

    return topic;
  }

  /**
   * Obtiene información de un usuario desde SIGA por documento
   * Endpoint: POST /talentotech2/informacion_reporte_1003
   * Headers: token_autenticacion (auth_token) y token (access_token)
   * Body: JSON con {"soloactivos": true/false}
   */
  async getUserFromSiga(documento: string): Promise<any> {
    try {
      // Obtener ambos tokens
      const accessToken = await this.ensureValidToken();
      const authToken = await this.ensureValidAuthToken();

      this.logger.log(`Consultando información SIGA para documento: ${documento}`);

      // Llamar al endpoint de reporte 1003
      const response = await this.axiosInstance.post(
        '/talentotech2/informacion_reporte_1003',
        {
          soloactivos: false, // Traer todos los usuarios
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'token_autenticacion': authToken,
            'token': accessToken,
          },
        },
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Respuesta inválida de SIGA: se esperaba un array de usuarios');
      }

      // Buscar el usuario por documento
      const usuario = response.data.find(
        (user: any) => user.documento_numero === documento,
      );

      if (!usuario) {
        this.logger.warn(`Usuario no encontrado en SIGA: ${documento}`);
        return null;
      }

      this.logger.log(`Usuario encontrado en SIGA: ${usuario.nombres} ${usuario.apellidos}`);

      return usuario;
    } catch (error) {
      this.logger.error('Error obteniendo usuario de SIGA:', error.message);
      if (error.response) {
        this.logger.error('Respuesta SIGA:', error.response.data);
      }
      throw new HttpException(
        'Error al obtener información del usuario',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Alias de getUserFromSiga para mejor legibilidad
   */
  async getUserByDocumento(documento: string): Promise<any> {
    return this.getUserFromSiga(documento);
  }
}
