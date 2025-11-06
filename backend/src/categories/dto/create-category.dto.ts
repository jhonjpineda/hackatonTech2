import { IsString, IsOptional, IsInt, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre del tema/categoría' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del tema' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Icono del tema' })
  @IsOptional()
  @IsString()
  icono?: string;

  @ApiPropertyOptional({ description: 'Máximo de participantes para esta categoría' })
  @IsOptional()
  @IsInt()
  maxParticipantes?: number;

  @ApiPropertyOptional({ description: 'Máximo de equipos para esta categoría' })
  @IsOptional()
  @IsInt()
  maxEquipos?: number;

  @ApiPropertyOptional({ description: 'Categoría activa', default: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @ApiProperty({ description: 'ID del hackathon' })
  @IsUUID()
  hackathonId: string;

  @ApiPropertyOptional({ description: 'ID del tema/topic asociado' })
  @IsOptional()
  @IsUUID()
  topicId?: string;
}
