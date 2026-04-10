import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { DayOfWeekEnum } from '../enums/day-of-week.enum';
import { Schedule } from '../models/schedule.model';

export abstract class ISchedulesRepository {
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
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    organizationId: string,
    userId: string,
  ): Promise<Schedule>;
  public abstract getById(
    scheduleId: string,
    organizationId: string,
  ): Promise<Schedule>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Schedule>>;
  public abstract update(
    scheduleId: string,
    dayOfWeek: DayOfWeekEnum | undefined,
    startTime: string | undefined,
    endTime: string | undefined,
    userId: string,
  ): Promise<Schedule>;
  public abstract delete(scheduleId: string, userId: string): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
