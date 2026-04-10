import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSchoolParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}

export class CreateSchoolBodyDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;
}
