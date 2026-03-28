import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateSubjectParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public subjectId: string;
}

export class UpdateSubjectBodyDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  public name?: string;
}
