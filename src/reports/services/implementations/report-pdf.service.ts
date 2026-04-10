import { Inject, Injectable } from '@nestjs/common';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { LocaleEnum } from '../../../i18n/enums/locale.enum';
import { II18nService } from '../../../i18n/services/i.i18n.service';
import { StudentReport } from '../../models/student-report.model';
import {
  type ReportLabels,
  buildStudentReportHtml,
} from '../../templates/student-report.template';
import { IReportPdfService } from '../i.report-pdf.service';

@Injectable()
export class ReportPdfService extends IReportPdfService {
  public constructor(@Inject(II18nService) i18nService: II18nService) {
    super(i18nService);
  }

  public async generateStudentReportPdf(
    report: StudentReport,
    locale: LocaleEnum,
  ): Promise<Buffer> {
    const labels = this.buildLabels(locale);
    const html = buildStudentReportHtml(report, labels, locale);

    const isServerless =
      !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;

    const executablePath = isServerless
      ? await chromium.executablePath()
      : (process.env.CHROME_EXECUTABLE_PATH ?? undefined);

    const browser = await puppeteer.launch({
      args: isServerless
        ? chromium.args
        : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildLabels(locale: LocaleEnum): ReportLabels {
    const t = (key: string): string => this.i18nService.t(locale, key);

    return {
      student: t('reports.student'),
      registration: t('reports.registration'),
      classes: t('reports.classes'),
      educationLevel: t('reports.educationLevel'),
      gradeLevel: t('reports.gradeLevel'),
      school: t('reports.school'),
      startDate: t('reports.startDate'),
      endDate: t('reports.endDate'),
      date: t('reports.date'),
      day: t('reports.day'),
      time: t('reports.time'),
      teacher: t('reports.teacher'),
      subjects: t('reports.subjects'),
      topics: t('reports.topics'),
      noRegistration: t('reports.noRegistration'),
      noClasses: t('reports.noClasses'),
      generatedOn: t('reports.generatedOn'),
    };
  }
}
