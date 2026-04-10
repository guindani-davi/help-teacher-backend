import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  public refreshToken: string;
}
