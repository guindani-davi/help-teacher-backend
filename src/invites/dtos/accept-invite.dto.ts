import { IsUUID } from 'class-validator';

export class AcceptInviteParamsDTO {
  @IsUUID()
  public inviteId: string;
}
