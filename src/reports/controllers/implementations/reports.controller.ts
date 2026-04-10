import {
  Controller,
  Get,
  Inject,
  Param,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentMembership } from '../../../auth/decorators/current-membership.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { MembershipGuard } from '../../../memberships/guards/membership.guard';
import type { Membership } from '../../../memberships/models/membership.model';
import { AllowedTiers } from '../../../subscriptions/decorators/allowed-tiers.decorator';
import { SubscriptionTierEnum } from '../../../subscriptions/enums/subscription-tier.enum';
import { SubscriptionTierGuard } from '../../../subscriptions/guards/subscription-tier.guard';
import { GetStudentReportParamsDTO } from '../../dtos/get-student-report.dto';
import { StudentReport } from '../../models/student-report.model';
import { IReportsService } from '../../services/i.reports.service';
import { IReportsController } from '../i.reports.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, SubscriptionTierGuard)
@AllowedTiers(SubscriptionTierEnum.PRO)
export class ReportsController extends IReportsController {
  public constructor(@Inject(IReportsService) reportsService: IReportsService) {
    super(reportsService);
  }

  @Get(':slug/reports/students/:studentId')
  public async getStudentReport(
    @Param() params: GetStudentReportParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<StudentReport> {
    return this.reportsService.getStudentReport(params, membership, user);
  }

  @Get(':slug/reports/students/:studentId/pdf')
  public async getStudentReportPdf(
    @Param() params: GetStudentReportParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.reportsService.getStudentReportPdf(
      params,
      membership,
      user,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="student-report-${params.studentId}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
