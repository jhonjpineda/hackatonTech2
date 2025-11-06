import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsArray,
  IsUUID,
} from 'class-validator';
import { HackathonStatus, HackathonMode } from '../../entities/hackathon.entity';

export class CreateHackathonDto {
  @ApiProperty({ example: 'Hackathon IA 2025', description: 'Nombre del hackathon' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  nombre: string;

  @ApiProperty({
    example: 'Un hackathon enfocado en soluciones de inteligencia artificial',
    description: 'Descripción completa del hackathon',
  })
  @IsString()
  @MinLength(10)
  descripcion: string;

  @ApiPropertyOptional({
    example: 'Hackathon de IA',
    description: 'Descripción corta para tarjetas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcionCorta?: string;

  @ApiPropertyOptional({
    enum: HackathonStatus,
    example: HackathonStatus.DRAFT,
    description: 'Estado del hackathon',
  })
  @IsOptional()
  @IsEnum(HackathonStatus)
  estado?: HackathonStatus;

  @ApiProperty({
    enum: HackathonMode,
    example: HackathonMode.PRESENCIAL,
    description: 'Modalidad del hackathon',
  })
  @IsEnum(HackathonMode)
  modalidad: HackathonMode;

  @ApiProperty({
    example: '2025-11-15T08:00:00Z',
    description: 'Fecha y hora de inicio',
  })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({
    example: '2025-11-17T20:00:00Z',
    description: 'Fecha y hora de finalización',
  })
  @IsDateString()
  fechaFin: string;

  @ApiProperty({
    example: '2025-11-10T23:59:59Z',
    description: 'Fecha límite para inscripciones',
  })
  @IsDateString()
  fechaLimiteInscripcion: string;

  @ApiPropertyOptional({
    example: 'Campus Principal - Edificio A',
    description: 'Ubicación física del evento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ubicacion?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/imagen.jpg',
    description: 'URL de la imagen del hackathon',
  })
  @IsOptional()
  @IsString()
  urlImagen?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Número máximo de participantes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipantes?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Número máximo de equipos',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxEquipos?: number;

  @ApiProperty({
    example: 1,
    description: 'Mínimo de miembros por equipo',
  })
  @IsInt()
  @Min(1)
  @Max(10)
  minMiembrosEquipo: number;

  @ApiProperty({
    example: 5,
    description: 'Máximo de miembros por equipo',
  })
  @IsInt()
  @Min(1)
  @Max(10)
  maxMiembrosEquipo: number;

  @ApiPropertyOptional({
    example: 'Conocimientos básicos de programación',
    description: 'Requisitos para participar',
  })
  @IsOptional()
  @IsString()
  requisitos?: string;

  @ApiPropertyOptional({
    example: '1er lugar: $1000, 2do lugar: $500',
    description: 'Premios del hackathon',
  })
  @IsOptional()
  @IsString()
  premios?: string;

  @ApiPropertyOptional({
    example: 'No se permite código pre-existente',
    description: 'Reglas del hackathon',
  })
  @IsOptional()
  @IsString()
  reglas?: string;

  @ApiPropertyOptional({
    example: 'APIs disponibles: OpenAI, Google Cloud',
    description: 'Recursos disponibles para participantes',
  })
  @IsOptional()
  @IsString()
  recursos?: string;

  @ApiPropertyOptional({
    example: 'https://discord.gg/example',
    description: 'URL del servidor de Discord',
  })
  @IsOptional()
  @IsUrl()
  urlDiscord?: string;

  @ApiPropertyOptional({
    example: 'https://slack.com/example',
    description: 'URL del workspace de Slack',
  })
  @IsOptional()
  @IsUrl()
  urlSlack?: string;

  @ApiPropertyOptional({
    example: 'https://chat.whatsapp.com/example',
    description: 'URL del grupo de WhatsApp',
  })
  @IsOptional()
  @IsUrl()
  urlWhatsapp?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica si la inscripción está abierta',
  })
  @IsOptional()
  @IsBoolean()
  inscripcionAbierta?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica si el hackathon está publicado',
  })
  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @ApiPropertyOptional({
    example: ['uuid1', 'uuid2'],
    description: 'IDs de los temas relacionados con el hackathon',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  topicsIds?: string[];
}
