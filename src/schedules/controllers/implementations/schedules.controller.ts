import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentMembership } from '../../../auth/decorators/current-membership.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AllowedRoles } from '../../../auth/decorators/roles.decorator';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { MembershipGuard } from '../../../memberships/guards/membership.guard';
import type { Membership } from '../../../memberships/models/membership.model';
import { ActiveSubscriptionGuard } from '../../../subscriptions/guards/active-subscription.guard';
import { CreateScheduleBodyDTO } from '../../dtos/create-schedule.dto';
import { DeleteScheduleParamsDTO } from '../../dtos/delete-schedule.dto';
import { GetScheduleParamsDTO } from '../../dtos/get-schedule.dto';
import {
  UpdateScheduleBodyDTO,
  UpdateScheduleParamsDTO,
} from '../../dtos/update-schedule.dto';
import { Schedule } from '../../models/schedule.model';
import { ISchedulesService } from '../../services/i.schedules.service';
import { ISchedulesController } from '../i.schedules.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class SchedulesController extends ISchedulesController {
  public constructor(
    @Inject(ISchedulesService) schedulesService: ISchedulesService,
  ) {
    super(schedulesService);
  }

  @Post(':slug/schedules')
  public async create(
    @Body() body: CreateScheduleBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Schedule> {
    return this.schedulesService.create(body, membership, user);
  }

  @Get(':slug/schedules')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Schedule>> {
    return this.schedulesService.getByOrganization(membership, pagination);
  }

  @Get(':slug/schedules/:scheduleId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetScheduleParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<Schedule> {
    return this.schedulesService.getById(params, membership);
  }

  @Patch(':slug/schedules/:scheduleId')
  public async update(
    @Param() params: UpdateScheduleParamsDTO,
    @Body() body: UpdateScheduleBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Schedule> {
    return this.schedulesService.update(params, body, membership, user);
  }

  @Delete(':slug/schedules/:scheduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteScheduleParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.schedulesService.delete(params, membership, user);
  }
}
