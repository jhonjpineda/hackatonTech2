import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'Calificación otorgada' })
  @IsNumber()
  calificacion: number;

  @ApiPropertyOptional({ description: 'Comentarios del juez' })
  @IsOptional()
  @IsString()
  comentarios?: string;

  @ApiProperty({ description: 'ID de la rúbrica' })
  @IsUUID()
  rubricId: string;

  @ApiProperty({ description: 'ID del equipo' })
  @IsUUID()
  teamId: string;
}
