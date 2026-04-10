import { Injectable } from '@nestjs/common';
import type { LocaleEnum } from '../../i18n/enums/locale.enum';
import { IStorageService } from '../../storage/services/i.storage.service';

@Injectable()
export abstract class IReportCacheService {
  protected readonly storageService: IStorageService;

  public constructor(storageService: IStorageService) {
    this.storageService = storageService;
  }

  public abstract getCachedPdf(
    organizationId: string,
    studentId: string,
    locale: LocaleEnum,
  ): Promise<Buffer | null>;

  public abstract cachePdf(
    organizationId: string,
    studentId: string,
    locale: LocaleEnum,
    pdf: Buffer,
  ): Promise<void>;

  public abstract invalidateCache(
    organizationId: string,
    studentId: string,
  ): Promise<void>;

  public abstract invalidateAllForOrg(organizationId: string): Promise<void>;
}
