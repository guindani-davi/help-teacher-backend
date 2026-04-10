import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetSchedulesParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
