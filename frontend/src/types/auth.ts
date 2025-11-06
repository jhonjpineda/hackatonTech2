import { Topic } from './hackathon';

export enum UserRole {
  CAMPISTA = 'CAMPISTA',
  JUEZ = 'JUEZ',
  ORGANIZADOR = 'ORGANIZADOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum UserSource {
  SIGA = 'SIGA',
  DIRECT = 'DIRECT',
}

export enum SigaStatus {
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  NO_VERIFICADO = 'NO_VERIFICADO',
  INHABILITADO = 'INHABILITADO',
}

export interface User {
  id: string;
  documento: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLogin?: string;

  // Campos SIGA
  tipoDocumento?: string;
  sigaPreinscripcionId?: string;
  sigaInscripcionId?: string;
  sigaStatus?: SigaStatus;
  source: UserSource;
  isPreRegistered: boolean;
  isFullyRegistered: boolean;
  fechaNacimiento?: string;
  fechaExpedicionDocumento?: string;
  genero?: string;
  departamentoResidencia?: string;
  municipioResidencia?: string;

  // Relaciones
  interestTopics?: Topic[];

  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  documento: string;
  password: string;
}

export interface RegisterDto {
  documento: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
}

export interface RegisterWithSigaDto {
  documento: string;
  fechaExpedicion?: string;
}

export interface VerifyTokenDto {
  token: string;
}

export interface CompleteRegistrationDto {
  token: string;
  password: string;
  interestTopicIds?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface VerificationResponse {
  message: string;
  email: string;
}

export interface TokenVerificationResponse {
  isValid: boolean;
  user: {
    documento: string;
    nombres: string;
    apellidos: string;
    email: string;
    interestTopics: Topic[];
  };
}
