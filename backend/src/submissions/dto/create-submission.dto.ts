import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsArray,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Título del proyecto',
    example: 'Sistema de gestión de inventario',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @ApiProperty({
    description: 'Descripción detallada del proyecto',
    example:
      'Sistema completo para gestión de inventarios con alertas automáticas y reportes en tiempo real',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({
    description: 'URL del repositorio de código (GitHub, GitLab, etc.)',
    example: 'https://github.com/usuario/proyecto',
  })
  @IsUrl()
  @IsOptional()
  repositorioUrl?: string;

  @ApiPropertyOptional({
    description: 'URL de la demostración o aplicación desplegada',
    example: 'https://mi-proyecto.vercel.app',
  })
  @IsUrl()
  @IsOptional()
  demoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL del video de presentación',
    example: 'https://youtube.com/watch?v=...',
  })
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Tecnologías utilizadas',
    example: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  tecnologias?: string[];

  @ApiPropertyOptional({
    description: 'URL de la documentación técnica',
    example: 'https://docs.mi-proyecto.com',
  })
  @IsUrl()
  @IsOptional()
  documentacionUrl?: string;

  @ApiProperty({
    description: 'ID del equipo que hace la entrega',
    example: 'uuid-del-equipo',
  })
  @IsUUID()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({
    description: 'ID del reto al que se entrega',
    example: 'uuid-del-reto',
  })
  @IsUUID()
  @IsNotEmpty()
  challengeId: string;

  @ApiPropertyOptional({
    description: 'Comentarios adicionales',
  })
  @IsString()
  @IsOptional()
  comentarios?: string;
}
