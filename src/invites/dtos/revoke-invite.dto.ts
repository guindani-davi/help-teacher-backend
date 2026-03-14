import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RevokeInviteParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;

  @IsUUID()
  public inviteId: string;
}
