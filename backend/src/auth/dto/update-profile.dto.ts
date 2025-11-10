import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nombres del usuario' })
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiPropertyOptional({ description: 'Apellidos del usuario' })
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiPropertyOptional({ description: 'Email del usuario' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono del usuario' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'IDs de temas de interés adicionales (solo para campistas)',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestTopicIds?: string[];
}
