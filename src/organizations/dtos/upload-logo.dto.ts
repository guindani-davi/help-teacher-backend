import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadLogoParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;
}
