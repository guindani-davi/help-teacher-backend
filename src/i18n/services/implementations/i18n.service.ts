import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LocaleEnum } from '../../enums/locale.enum';
import { II18nService } from '../i.i18n.service';

@Injectable()
export class I18nService extends II18nService {
  private readonly logger: Logger;
  private readonly translations = new Map<string, Record<string, string>>();

  public constructor() {
    super();
    this.logger = new Logger(I18nService.name);
    this.loadTranslations();
  }

  public t(
    locale: LocaleEnum,
    key: string,
    args?: Record<string, string>,
  ): string {
    const localeMessages = this.translations.get(locale);
    let message = localeMessages?.[key];

    if (!message) {
      const fallback = this.translations.get(LocaleEnum.EN);
      message = fallback?.[key];
    }

    if (!message) {
      this.logger.warn(
        `Missing translation for key "${key}" in locale "${locale}"`,
      );
      return key;
    }

    if (args) {
      for (const [argKey, argValue] of Object.entries(args)) {
        message = message.replaceAll(`{${argKey}}`, argValue);
      }
    }

    return message;
  }

  private loadTranslations(): void {
    const translationsDir = path.join(__dirname, '..', '..', 'translations');

    for (const locale of Object.values(LocaleEnum)) {
      const filePath = path.join(translationsDir, `${locale}.json`);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content) as Record<string, unknown>;
        const flatMap = this.flatten(json);
        this.translations.set(locale, flatMap);
      } catch (error) {
        this.logger.error(
          `Failed to load translations for locale "${locale}": ${error}`,
        );
      }
    }
  }

  private flatten(
    obj: Record<string, unknown>,
    prefix = '',
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        result[fullKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(
          result,
          this.flatten(value as Record<string, unknown>, fullKey),
        );
      }
    }

    return result;
  }
}
