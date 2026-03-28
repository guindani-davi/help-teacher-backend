import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateStudentParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public studentId: string;
}

export class UpdateStudentBodyDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  public name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  public surname?: string;
}
