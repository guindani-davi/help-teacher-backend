import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStudentParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}

export class CreateStudentBodyDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public surname: string;
}
