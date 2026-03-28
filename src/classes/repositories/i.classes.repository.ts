import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { Class } from '../models/class.model';

export abstract class IClassesRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract create(
    scheduleId: string,
    studentId: string,
    teacherId: string,
    date: string,
    organizationId: string,
    userId: string,
  ): Promise<Class>;
  public abstract getById(
    classId: string,
    organizationId: string,
  ): Promise<Class>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Class>>;
  public abstract update(
    classId: string,
    scheduleId: string | undefined,
    studentId: string | undefined,
    teacherId: string | undefined,
    date: string | undefined,
    userId: string,
  ): Promise<Class>;
  public abstract delete(classId: string, userId: string): Promise<void>;
  public abstract deactivateByScheduleId(
    scheduleId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract getActiveIdsByScheduleId(
    scheduleId: string,
  ): Promise<string[]>;
  public abstract getActiveIdsByStudentId(studentId: string): Promise<string[]>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
