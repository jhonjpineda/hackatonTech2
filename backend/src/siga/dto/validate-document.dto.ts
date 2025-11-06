import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ValidateDocumentDto {
  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @IsString()
  @IsOptional()
  fechaExpedicion?: string;
}
