import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetSchoolsParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
