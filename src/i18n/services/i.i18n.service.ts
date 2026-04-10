import { Injectable } from '@nestjs/common';
import { LocaleEnum } from '../enums/locale.enum';

@Injectable()
export abstract class II18nService {
  public constructor() {}

  public abstract t(
    locale: LocaleEnum,
    key: string,
    args?: Record<string, string>,
  ): string;
}
