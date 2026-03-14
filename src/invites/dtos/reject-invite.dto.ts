import { IsUUID } from 'class-validator';

export class RejectInviteParamsDTO {
  @IsUUID()
  public inviteId: string;
}
