import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteMemberParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;

  @IsUUID()
  public memberId: string;
}
