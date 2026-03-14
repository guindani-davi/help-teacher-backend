import { IsUUID } from 'class-validator';

export class GetInviteParamsDTO {
  @IsUUID()
  public inviteId: string;
}
