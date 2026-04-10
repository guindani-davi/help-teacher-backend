import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class RevokeInviteParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public inviteId: string;
}
