import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DeleteMemberParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public memberId: string;
}
