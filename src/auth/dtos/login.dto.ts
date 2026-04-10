import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  public password: string;
}
