import { Injectable } from '@nestjs/common';
import { IDatabaseService } from '../../database/services/i.database.service';
import { StudentReport } from '../models/student-report.model';

@Injectable()
export abstract class IReportDataService {
  protected readonly databaseService: IDatabaseService;

  public constructor(databaseService: IDatabaseService) {
    this.databaseService = databaseService;
  }

  public abstract assembleStudentReport(
    studentId: string,
    organizationId: string,
  ): Promise<StudentReport>;
}
