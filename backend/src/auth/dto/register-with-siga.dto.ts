import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class RegisterWithSigaDto {
  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsString()
  @IsOptional()
  fechaExpedicion?: string;
}

export class CompleteRegistrationDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsArray()
  @IsOptional()
  interestTopicIds?: string[];
}

export class VerifyTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
