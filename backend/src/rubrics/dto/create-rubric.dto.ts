import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRubricDto {
  @ApiProperty({ description: 'Nombre de la rúbrica' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción de la rúbrica' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Porcentaje de esta rúbrica (debe sumar 100% con otras)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje: number;

  @ApiPropertyOptional({
    description: 'Escala máxima de calificación',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  escalaMaxima?: number;

  @ApiPropertyOptional({
    description: 'Escala mínima de calificación',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  escalaMinima?: number;

  @ApiPropertyOptional({ description: 'Orden de visualización', default: 0 })
  @IsOptional()
  @IsInt()
  orden?: number;

  @ApiPropertyOptional({ description: 'Rúbrica activa', default: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @ApiProperty({ description: 'ID del reto' })
  @IsUUID()
  challengeId: string;
}
