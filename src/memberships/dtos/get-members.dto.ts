import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetMembersParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
