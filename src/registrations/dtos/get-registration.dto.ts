import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class GetRegistrationParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public registrationId: string;
}
