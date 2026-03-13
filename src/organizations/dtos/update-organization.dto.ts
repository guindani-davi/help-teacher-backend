import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationBySlugParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;
}

export class UpdateOrganizationBySlugBodyDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public name?: string;
}
