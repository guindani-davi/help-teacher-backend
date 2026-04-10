import type { LocaleEnum } from '../../i18n/enums/locale.enum';
import { User } from './user.model';

export class SafeUser {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly surname: string;
  public readonly hasUsedTrial: boolean;
  public readonly locale: LocaleEnum;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.surname = user.surname;
    this.hasUsedTrial = user.hasUsedTrial;
    this.locale = user.locale;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
