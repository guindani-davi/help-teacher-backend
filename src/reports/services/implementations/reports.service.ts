import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { ForbiddenOperationException } from '../../../memberships/exceptions/forbidden-operation.exception';
import type { Membership } from '../../../memberships/models/membership.model';
import { GetStudentReportParamsDTO } from '../../dtos/get-student-report.dto';
import { StudentReport } from '../../models/student-report.model';
import { IReportCacheService } from '../i.report-cache.service';
import { IReportDataService } from '../i.report-data.service';
import { IReportPdfService } from '../i.report-pdf.service';
import { IReportsService } from '../i.reports.service';

@Injectable()
export class ReportsService extends IReportsService {
  public constructor(
    @Inject(IReportDataService) reportDataService: IReportDataService,
    @Inject(IReportPdfService) reportPdfService: IReportPdfService,
    @Inject(IReportCacheService) reportCacheService: IReportCacheService,
    @Inject(IDatabaseService) databaseService: IDatabaseService,
  ) {
    super(
      reportDataService,
      reportPdfService,
      reportCacheService,
      databaseService,
    );
  }

  public async getStudentReport(
    params: GetStudentReportParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<StudentReport> {
    await this.authorizeAccess(params.studentId, membership, user);

    return this.reportDataService.assembleStudentReport(
      params.studentId,
      membership.organizationId,
    );
  }

  public async getStudentReportPdf(
    params: GetStudentReportParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Buffer> {
    await this.authorizeAccess(params.studentId, membership, user);

    const cached = await this.reportCacheService.getCachedPdf(
      membership.organizationId,
      params.studentId,
      user.locale,
    );

    if (cached) {
      return cached;
    }

    const report = await this.reportDataService.assembleStudentReport(
      params.studentId,
      membership.organizationId,
    );

    const pdf = await this.reportPdfService.generateStudentReportPdf(
      report,
      user.locale,
    );

    await this.reportCacheService.cachePdf(
      membership.organizationId,
      params.studentId,
      user.locale,
      pdf,
    );

    return pdf;
  }

  private async authorizeAccess(
    studentId: string,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    const roles = membership.roles;

    const hasFullAccess = roles.some(
      (role) =>
        role === RolesEnum.OWNER ||
        role === RolesEnum.ADMIN ||
        role === RolesEnum.TEACHER,
    );

    if (hasFullAccess) {
      return;
    }

    const result = await this.databaseService
      .from('student_users')
      .select('id')
      .eq('user_id', user.sub)
      .eq('student_id', studentId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!result.data) {
      throw new ForbiddenOperationException(
        'You do not have access to this student',
        'errors.noAccessToStudent',
      );
    }
  }
}
