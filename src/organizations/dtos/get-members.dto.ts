import { IsNotEmpty, IsString } from 'class-validator';

export class GetMembersParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;
}
