import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { LocaleEnum } from '../../i18n/enums/locale.enum';
import { AtLeastOneField } from '../validators/at-least-one-field.validator';

@AtLeastOneField(['locale', 'password'])
export class UpdateUserBodyDTO {
  @IsEnum(LocaleEnum)
  @IsOptional()
  public locale?: LocaleEnum;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  @IsOptional()
  public password?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @ValidateIf((o: UpdateUserBodyDTO) => !!o.password)
  public currentPassword?: string;
}
