import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { IClassTopicsService } from '../../../class-topics/services/i.class-topics.service';
import { IClassesService } from '../../../classes/services/i.classes.service';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { CreateScheduleBodyDTO } from '../../dtos/create-schedule.dto';
import { DeleteScheduleParamsDTO } from '../../dtos/delete-schedule.dto';
import { GetScheduleParamsDTO } from '../../dtos/get-schedule.dto';
import {
  UpdateScheduleBodyDTO,
  UpdateScheduleParamsDTO,
} from '../../dtos/update-schedule.dto';
import { Schedule } from '../../models/schedule.model';
import { ISchedulesRepository } from '../../repositories/i.schedules.repository';
import { ISchedulesService } from '../i.schedules.service';

@Injectable()
export class SchedulesService extends ISchedulesService {
  public constructor(
    @Inject(ISchedulesRepository) schedulesRepository: ISchedulesRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => IClassesService)) classesService: IClassesService,
    @Inject(IClassTopicsService) classTopicsService: IClassTopicsService,
    @Inject(forwardRef(() => IReportCacheService))
    reportCacheService: IReportCacheService,
  ) {
    super(
      schedulesRepository,
      helperService,
      classesService,
      classTopicsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateScheduleBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Schedule> {
    return this.schedulesRepository.create(
      body.dayOfWeek,
      body.startTime,
      body.endTime,
      membership.organizationId,
      user.sub,
    );
  }

  public async getById(
    params: GetScheduleParamsDTO | string,
    membership: Membership | string,
  ): Promise<Schedule> {
    const scheduleId = typeof params === 'string' ? params : params.scheduleId;
    const organizationId =
      typeof membership === 'string' ? membership : membership.organizationId;

    return this.schedulesRepository.getById(scheduleId, organizationId);
  }

  public async getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Schedule>> {
    return this.schedulesRepository.getByOrganizationId(
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateScheduleParamsDTO,
    body: UpdateScheduleBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Schedule> {
    await this.schedulesRepository.getById(
      params.scheduleId,
      membership.organizationId,
    );

    const result = await this.schedulesRepository.update(
      params.scheduleId,
      body.dayOfWeek,
      body.startTime,
      body.endTime,
      user.sub,
    );

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );

    return result;
  }

  public async delete(
    params: DeleteScheduleParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.schedulesRepository.getById(
      params.scheduleId,
      membership.organizationId,
    );

    const classIds = await this.classesService.getActiveIdsByScheduleId(
      params.scheduleId,
    );

    await this.classTopicsService.deactivateByClassIds(classIds, user.sub);

    await this.classesService.deactivateByScheduleId(
      params.scheduleId,
      user.sub,
    );

    await this.schedulesRepository.delete(params.scheduleId, user.sub);

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );
  }
}
