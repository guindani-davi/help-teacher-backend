import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateOrganizationBodyDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;
}
