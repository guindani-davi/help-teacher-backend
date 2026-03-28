import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class RequestPasswordResetDTO {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  public email: string;
}
