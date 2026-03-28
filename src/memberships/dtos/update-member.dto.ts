import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { RolesEnum } from '../../auth/enums/roles.enum';

export class UpdateMemberParamsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  public slug: string;

  @IsUUID()
  public memberId: string;
}

export class UpdateMemberBodyDTO {
  @IsArray()
  @IsEnum(RolesEnum, { each: true })
  @IsOptional()
  public roles?: RolesEnum[];
}
