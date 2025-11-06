import { IsString, IsOptional, IsUUID, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'Nombre del equipo' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del equipo' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'ID de la categoría del hackathon' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'IDs de los miembros iniciales (opcional)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  miembrosIds?: string[];
}
