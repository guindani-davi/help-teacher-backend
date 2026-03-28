import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateRegistrationParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public registrationId: string;
}

export class UpdateRegistrationBodyDTO {
  @IsUUID()
  @IsOptional()
  public studentId?: string;

  @IsUUID()
  @IsOptional()
  public schoolId?: string;

  @IsUUID()
  @IsOptional()
  public gradeLevelId?: string;

  @IsDateString()
  @IsOptional()
  @MaxLength(255)
  public startDate?: string;

  @IsDateString()
  @IsOptional()
  @MaxLength(255)
  public endDate?: string | null;
}
