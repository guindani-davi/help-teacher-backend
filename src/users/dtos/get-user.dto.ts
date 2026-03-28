import { IsEmail, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class GetUserByIdParamsDTO {
  @IsNotEmpty()
  @IsUUID()
  public id: string;
}

export class GetUserByEmailParamsDTO {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  public email: string;
}
