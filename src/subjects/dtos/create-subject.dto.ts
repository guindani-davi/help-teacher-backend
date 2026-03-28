import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubjectParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}

export class CreateSubjectBodyDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;
}
