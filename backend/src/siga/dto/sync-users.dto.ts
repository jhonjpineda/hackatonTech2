import { IsBoolean, IsOptional } from 'class-validator';

export class SyncUsersDto {
  @IsBoolean()
  @IsOptional()
  forceSync?: boolean;

  @IsBoolean()
  @IsOptional()
  onlyApproved?: boolean;

  @IsBoolean()
  @IsOptional()
  soloActivos?: boolean;
}
