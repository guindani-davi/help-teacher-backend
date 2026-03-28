import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetClassesParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
