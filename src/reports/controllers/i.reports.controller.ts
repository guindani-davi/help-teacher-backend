import type { StreamableFile } from '@nestjs/common';
import type { JwtPayload } from '../../auth/models/jwt.model';
import type { Membership } from '../../memberships/models/membership.model';
import { GetStudentReportParamsDTO } from '../dtos/get-student-report.dto';
import { StudentReport } from '../models/student-report.model';
import { IReportsService } from '../services/i.reports.service';

export abstract class IReportsController {
  protected readonly reportsService: IReportsService;

  public constructor(reportsService: IReportsService) {
    this.reportsService = reportsService;
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
    res: unknown,
  ): Promise<StreamableFile>;
}
