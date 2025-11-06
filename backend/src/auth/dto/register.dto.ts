import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Número de documento del usuario',
    example: '1234567890',
  })
  @IsNotEmpty({ message: 'El documento es requerido' })
  @IsString({ message: 'El documento debe ser un texto' })
  documento: string;

  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Juan Carlos',
  })
  @IsNotEmpty({ message: 'Los nombres son requeridos' })
  @IsString({ message: 'Los nombres deben ser un texto' })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'García López',
  })
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  @IsString({ message: 'Los apellidos deben ser un texto' })
  apellidos: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.garcia@example.com',
  })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123',
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '3001234567',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  telefono?: string;
}
