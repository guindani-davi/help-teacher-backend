import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GetUserByIdParamsDTO {
  @IsNotEmpty()
  @IsString()
  public id: string;
}

export class GetUserByEmailParamsDTO {
  @IsEmail()
  @IsNotEmpty()
  public email: string;
}
