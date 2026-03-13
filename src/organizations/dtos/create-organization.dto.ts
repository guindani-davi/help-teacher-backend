import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizationBodyDTO {
  @IsString()
  @IsNotEmpty()
  public name: string;
}
