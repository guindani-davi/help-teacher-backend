import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteOrganizationParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;
}
