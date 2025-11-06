import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({ description: 'ID del usuario a agregar' })
  @IsUUID()
  userId: string;
}
