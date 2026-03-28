import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRegistrationParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}

export class CreateRegistrationBodyDTO {
  @IsUUID()
  public studentId: string;

  @IsUUID()
  public schoolId: string;

  @IsUUID()
  public gradeLevelId: string;

  @IsDateString()
  @MaxLength(255)
  public startDate: string;

  @IsDateString()
  @IsOptional()
  @MaxLength(255)
  public endDate?: string;
}
