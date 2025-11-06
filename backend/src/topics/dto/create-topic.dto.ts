import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { TopicType } from '../../entities/topic.entity';

export class CreateTopicDto {
  @ApiProperty({
    example: 'Programación',
    description: 'Nombre del tema',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Desarrollo de software y aplicaciones',
    description: 'Descripción del tema',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    enum: TopicType,
    example: TopicType.PROGRAMACION,
    description: 'Código único del tema',
  })
  @IsEnum(TopicType)
  codigo: TopicType;

  @ApiPropertyOptional({
    example: 'code',
    description: 'Nombre del icono (ej: code, brain, chart, cloud, blockchain, shield)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  icono?: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Color en formato hexadecimal',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'El color debe estar en formato hexadecimal (#RRGGBB)' })
  colorHex?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Orden de visualización',
  })
  @IsOptional()
  @IsInt()
  orden?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica si el tema está activo',
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
