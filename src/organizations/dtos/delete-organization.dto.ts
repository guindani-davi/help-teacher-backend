import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteOrganizationParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
