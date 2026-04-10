import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { IClassTopicsService } from '../../class-topics/services/i.class-topics.service';
import { IClassesService } from '../../classes/services/i.classes.service';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { CreateScheduleBodyDTO } from '../dtos/create-schedule.dto';
import { DeleteScheduleParamsDTO } from '../dtos/delete-schedule.dto';
import { GetScheduleParamsDTO } from '../dtos/get-schedule.dto';
import {
  UpdateScheduleBodyDTO,
  UpdateScheduleParamsDTO,
} from '../dtos/update-schedule.dto';
import { Schedule } from '../models/schedule.model';
import { ISchedulesRepository } from '../repositories/i.schedules.repository';

@Injectable()
export abstract class ISchedulesService {
  protected readonly schedulesRepository: ISchedulesRepository;
  protected readonly helperService: IHelpersService;
  protected readonly classesService: IClassesService;
  protected readonly classTopicsService: IClassTopicsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    schedulesRepository: ISchedulesRepository,
    helperService: IHelpersService,
    classesService: IClassesService,
    classTopicsService: IClassTopicsService,
    reportCacheService: IReportCacheService,
  ) {
    this.schedulesRepository = schedulesRepository;
    this.helperService = helperService;
    this.classesService = classesService;
    this.classTopicsService = classTopicsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    body: CreateScheduleBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Schedule>;
  public abstract getById(
    params: GetScheduleParamsDTO | string,
    membership: Membership | string,
  ): Promise<Schedule>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Schedule>>;
  public abstract update(
    params: UpdateScheduleParamsDTO,
    body: UpdateScheduleBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Schedule>;
  public abstract delete(
    params: DeleteScheduleParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
