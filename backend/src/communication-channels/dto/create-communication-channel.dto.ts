import { IsString, IsOptional, IsInt, IsEnum, IsUUID, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '../../entities/communication-channel.entity';

export class CreateCommunicationChannelDto {
  @ApiProperty({ description: 'Tipo de canal', enum: ChannelType })
  @IsEnum(ChannelType)
  tipo: ChannelType;

  @ApiProperty({ description: 'URL del canal' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Nombre personalizado del canal' })
  @IsOptional()
  @IsString()
  nombrePersonalizado?: string;

  @ApiPropertyOptional({ description: 'Descripción del canal' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Orden de visualización', default: 0 })
  @IsOptional()
  @IsInt()
  orden?: number;

  @ApiProperty({ description: 'ID del hackathon' })
  @IsUUID()
  hackathonId: string;
}
