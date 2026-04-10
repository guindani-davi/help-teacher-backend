import { Injectable } from '@nestjs/common';
import type { LocaleEnum } from '../../i18n/enums/locale.enum';
import { II18nService } from '../../i18n/services/i.i18n.service';
import { StudentReport } from '../models/student-report.model';

@Injectable()
export abstract class IReportPdfService {
  protected readonly i18nService: II18nService;

  public constructor(i18nService: II18nService) {
    this.i18nService = i18nService;
  }

  public abstract generateStudentReportPdf(
    report: StudentReport,
    locale: LocaleEnum,
  ): Promise<Buffer>;
}
