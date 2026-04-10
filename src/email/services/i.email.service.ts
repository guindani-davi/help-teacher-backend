import { Injectable } from '@nestjs/common';
import type { LocaleEnum } from '../../i18n/enums/locale.enum';
import { II18nService } from '../../i18n/services/i.i18n.service';

@Injectable()
export abstract class IEmailService {
  protected readonly i18nService: II18nService;

  public constructor(i18nService: II18nService) {
    this.i18nService = i18nService;
  }

  public abstract sendPasswordResetEmail(
    to: string,
    resetToken: string,
    locale: LocaleEnum,
  ): Promise<void>;

  public abstract sendInviteEmail(
    to: string,
    organizationName: string,
    locale: LocaleEnum,
  ): Promise<void>;
}
