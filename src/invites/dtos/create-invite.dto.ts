import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { RolesEnum } from '../../auth/enums/roles.enum';

export class CreateInviteParamsDTO {
  @IsString()
  @IsNotEmpty()
  public slug: string;
}

export class CreateInviteBodyDTO {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RolesEnum, { each: true })
  public roles: RolesEnum[];
}
