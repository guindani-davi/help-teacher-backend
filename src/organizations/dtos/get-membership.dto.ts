import { IsNotEmpty, IsString } from 'class-validator';

export class GetMembershipParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;
}
