import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ReportsController } from './controllers/implementations/reports.controller';
import { IReportCacheService } from './services/i.report-cache.service';
import { IReportDataService } from './services/i.report-data.service';
import { IReportPdfService } from './services/i.report-pdf.service';
import { IReportsService } from './services/i.reports.service';
import { ReportCacheService } from './services/implementations/report-cache.service';
import { ReportDataService } from './services/implementations/report-data.service';
import { ReportPdfService } from './services/implementations/report-pdf.service';
import { ReportsService } from './services/implementations/reports.service';

@Module({
  controllers: [ReportsController],
  imports: [
    DatabaseModule,
    StorageModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [
    {
      provide: IReportDataService,
      useClass: ReportDataService,
    },
    {
      provide: IReportPdfService,
      useClass: ReportPdfService,
    },
    {
      provide: IReportCacheService,
      useClass: ReportCacheService,
    },
    {
      provide: IReportsService,
      useClass: ReportsService,
    },
  ],
  exports: [IReportsService, IReportDataService, IReportCacheService],
})
export class ReportsModule {}
