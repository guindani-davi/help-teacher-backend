import { IsNotEmpty, IsString } from 'class-validator';

export class GetOrganizationBySlugParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;
}
