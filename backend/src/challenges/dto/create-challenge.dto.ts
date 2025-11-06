import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChallengeDifficulty,
  ChallengeStatus,
} from '../../entities/challenge.entity';

export class CreateChallengeDto {
  @ApiProperty({ description: 'Título del reto' })
  @IsString()
  titulo: string;

  @ApiProperty({ description: 'Descripción del reto' })
  @IsString()
  descripcion: string;

  @ApiPropertyOptional({
    description: 'Dificultad del reto',
    enum: ChallengeDifficulty,
    default: ChallengeDifficulty.MEDIO,
  })
  @IsOptional()
  @IsEnum(ChallengeDifficulty)
  dificultad?: ChallengeDifficulty;

  @ApiPropertyOptional({
    description: 'Estado del reto',
    enum: ChallengeStatus,
    default: ChallengeStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ChallengeStatus)
  estado?: ChallengeStatus;

  @ApiPropertyOptional({ description: 'Puntos del reto' })
  @IsOptional()
  @IsInt()
  puntos?: number;

  @ApiPropertyOptional({ description: 'Criterios de evaluación' })
  @IsOptional()
  @IsString()
  criteriosEvaluacion?: string;

  @ApiPropertyOptional({ description: 'Recursos disponibles' })
  @IsOptional()
  @IsString()
  recursos?: string;

  @ApiPropertyOptional({ description: 'Entregables esperados' })
  @IsOptional()
  @IsString()
  entregables?: string;

  @ApiPropertyOptional({ description: 'Fecha límite de entrega' })
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;

  @ApiPropertyOptional({ description: 'URL del PDF del reto' })
  @IsOptional()
  @IsString()
  urlPdf?: string;

  @ApiPropertyOptional({ description: 'Orden de visualización', default: 0 })
  @IsOptional()
  @IsInt()
  orden?: number;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsUUID()
  categoryId: string;
}
