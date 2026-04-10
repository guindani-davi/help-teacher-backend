import { Inject, Injectable } from '@nestjs/common';
import type { LocaleEnum } from '../../../i18n/enums/locale.enum';
import { StorageBucket } from '../../../storage/enums/storage-bucket.enum';
import { IStorageService } from '../../../storage/services/i.storage.service';
import { IReportCacheService } from '../i.report-cache.service';

@Injectable()
export class ReportCacheService extends IReportCacheService {
  public constructor(@Inject(IStorageService) storageService: IStorageService) {
    super(storageService);
  }

  public async getCachedPdf(
    organizationId: string,
    studentId: string,
    locale: LocaleEnum,
  ): Promise<Buffer | null> {
    const path = this.buildPath(organizationId, studentId, locale);
    return this.storageService.download(this.bucket, path);
  }

  public async cachePdf(
    organizationId: string,
    studentId: string,
    locale: LocaleEnum,
    pdf: Buffer,
  ): Promise<void> {
    const path = this.buildPath(organizationId, studentId, locale);
    await this.storageService.upload(this.bucket, path, pdf, 'application/pdf');
  }

  public async invalidateCache(
    organizationId: string,
    studentId: string,
  ): Promise<void> {
    const prefix = this.buildStudentPrefix(organizationId, studentId);
    await this.storageService.deleteByPrefix(this.bucket, prefix);
  }

  public async invalidateAllForOrg(organizationId: string): Promise<void> {
    await this.storageService.deleteByPrefix(this.bucket, organizationId);
  }

  private buildPath(
    organizationId: string,
    studentId: string,
    locale: string,
  ): string {
    return `${organizationId}/${studentId}/${locale}.pdf`;
  }

  private buildStudentPrefix(
    organizationId: string,
    studentId: string,
  ): string {
    return `${organizationId}/${studentId}`;
  }

  private get bucket(): StorageBucket {
    return StorageBucket.REPORTS;
  }
}
