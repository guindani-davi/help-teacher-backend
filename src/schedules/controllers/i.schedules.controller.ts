import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateScheduleBodyDTO } from '../dtos/create-schedule.dto';
import { DeleteScheduleParamsDTO } from '../dtos/delete-schedule.dto';
import { GetScheduleParamsDTO } from '../dtos/get-schedule.dto';
import {
  UpdateScheduleBodyDTO,
  UpdateScheduleParamsDTO,
} from '../dtos/update-schedule.dto';
import { Schedule } from '../models/schedule.model';
import { ISchedulesService } from '../services/i.schedules.service';

export abstract class ISchedulesController {
  protected readonly schedulesService: ISchedulesService;

  public constructor(schedulesService: ISchedulesService) {
    this.schedulesService = schedulesService;
  }

  public abstract create(
    body: CreateScheduleBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Schedule>;
  public abstract getById(
    params: GetScheduleParamsDTO,
    membership: Membership,
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
