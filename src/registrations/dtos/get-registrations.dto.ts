import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetRegistrationsParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
