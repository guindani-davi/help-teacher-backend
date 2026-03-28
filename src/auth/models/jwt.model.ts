import type { LocaleEnum } from '../../i18n/enums/locale.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  locale: LocaleEnum;
}
