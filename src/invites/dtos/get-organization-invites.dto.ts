import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetOrganizationInvitesParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
