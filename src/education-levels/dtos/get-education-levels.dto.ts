import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetEducationLevelsParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
