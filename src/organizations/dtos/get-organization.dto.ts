import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetOrganizationBySlugParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
