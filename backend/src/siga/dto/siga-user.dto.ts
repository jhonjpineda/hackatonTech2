import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class SigaUserDto {
  @IsString()
  numeroPreinscripcion: string;

  @IsString()
  numeroInscripcion: string;

  @IsString()
  tipoDocumento: string;

  @IsString()
  numeroDocumento: string;

  @IsString()
  nombres: string;

  @IsString()
  apellidos: string;

  @IsEmail()
  correoElectronico: string;

  @IsString()
  fechaNacimiento: string;

  @IsString()
  @IsOptional()
  fechaExpedicionDocumento?: string;

  @IsString()
  @IsOptional()
  genero?: string;

  @IsString()
  @IsOptional()
  telefonoCelular?: string;

  @IsString()
  @IsOptional()
  departamentoResidencia?: string;

  @IsString()
  @IsOptional()
  municipioResidencia?: string;

  @IsString()
  programaInteres: string;

  @IsEnum(['APROBADO', 'RECHAZADO', 'NO_VERIFICADO', 'INHABILITADO'])
  inscripcionAprobada: 'APROBADO' | 'RECHAZADO' | 'NO_VERIFICADO' | 'INHABILITADO';

  @IsString()
  fechaSolicitud: string;

  @IsString()
  @IsOptional()
  fechaAprobacion?: string;

  @IsString()
  @IsOptional()
  urlDocumento?: string;
}
