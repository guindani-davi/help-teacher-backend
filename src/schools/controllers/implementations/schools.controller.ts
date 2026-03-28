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
import { MembershipGuard } from '../../../auth/guards/membership.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import type { Membership } from '../../../memberships/models/membership.model';
import { ActiveSubscriptionGuard } from '../../../subscriptions/guards/active-subscription.guard';
import { CreateSchoolBodyDTO } from '../../dtos/create-school.dto';
import { DeleteSchoolParamsDTO } from '../../dtos/delete-school.dto';
import { GetSchoolParamsDTO } from '../../dtos/get-school.dto';
import {
  UpdateSchoolBodyDTO,
  UpdateSchoolParamsDTO,
} from '../../dtos/update-school.dto';
import { School } from '../../models/school.model';
import { ISchoolsService } from '../../services/i.schools.service';
import { ISchoolsController } from '../i.schools.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class SchoolsController extends ISchoolsController {
  public constructor(@Inject(ISchoolsService) schoolsService: ISchoolsService) {
    super(schoolsService);
  }

  @Post(':slug/schools')
  public async create(
    @Body() body: CreateSchoolBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<School> {
    return this.schoolsService.create(body, membership, user);
  }

  @Get(':slug/schools')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<School>> {
    return this.schoolsService.getByOrganization(membership, pagination);
  }

  @Get(':slug/schools/:schoolId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetSchoolParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<School> {
    return this.schoolsService.getById(params, membership);
  }

  @Patch(':slug/schools/:schoolId')
  public async update(
    @Param() params: UpdateSchoolParamsDTO,
    @Body() body: UpdateSchoolBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<School> {
    return this.schoolsService.update(params, body, membership, user);
  }

  @Delete(':slug/schools/:schoolId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteSchoolParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.schoolsService.delete(params, membership, user);
  }
}
