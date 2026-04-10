import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetMembershipParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
