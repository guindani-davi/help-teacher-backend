import { IsNotEmpty, IsString } from 'class-validator';

export class GetOrganizationInvitesParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;
}
