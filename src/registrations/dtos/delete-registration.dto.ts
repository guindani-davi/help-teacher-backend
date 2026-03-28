import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DeleteRegistrationParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public registrationId: string;
}
