import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetStudentsParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
