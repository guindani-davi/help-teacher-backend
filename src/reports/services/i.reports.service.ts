import { Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/database/services/i.database.service';
import type { JwtPayload } from '../../auth/models/jwt.model';
import type { Membership } from '../../memberships/models/membership.model';
import { GetStudentReportParamsDTO } from '../dtos/get-student-report.dto';
import { StudentReport } from '../models/student-report.model';
import { IReportCacheService } from './i.report-cache.service';
import { IReportDataService } from './i.report-data.service';
import { IReportPdfService } from './i.report-pdf.service';

@Injectable()
export abstract class IReportsService {
  protected readonly reportDataService: IReportDataService;
  protected readonly reportPdfService: IReportPdfService;
  protected readonly reportCacheService: IReportCacheService;
  protected readonly databaseService: IDatabaseService;

  public constructor(
    reportDataService: IReportDataService,
    reportPdfService: IReportPdfService,
    reportCacheService: IReportCacheService,
    databaseService: IDatabaseService,
  ) {
    this.reportDataService = reportDataService;
    this.reportPdfService = reportPdfService;
    this.reportCacheService = reportCacheService;
    this.databaseService = databaseService;
  }

  public abstract getStudentReport(
    params: GetStudentReportParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<StudentReport>;

  public abstract getStudentReportPdf(
    params: GetStudentReportParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Buffer>;
}
