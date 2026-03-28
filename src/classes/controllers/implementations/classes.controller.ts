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
import { CreateClassBodyDTO } from '../../dtos/create-class.dto';
import { DeleteClassParamsDTO } from '../../dtos/delete-class.dto';
import { GetClassParamsDTO } from '../../dtos/get-class.dto';
import {
  UpdateClassBodyDTO,
  UpdateClassParamsDTO,
} from '../../dtos/update-class.dto';
import { Class } from '../../models/class.model';
import { IClassesService } from '../../services/i.classes.service';
import { IClassesController } from '../i.classes.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class ClassesController extends IClassesController {
  public constructor(@Inject(IClassesService) classesService: IClassesService) {
    super(classesService);
  }

  @Post(':slug/classes')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async create(
    @Body() body: CreateClassBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Class> {
    return this.classesService.create(body, membership, user);
  }

  @Get(':slug/classes')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Class>> {
    return this.classesService.getByOrganization(membership, pagination);
  }

  @Get(':slug/classes/:classId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetClassParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<Class> {
    return this.classesService.getById(params, membership);
  }

  @Patch(':slug/classes/:classId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  public async update(
    @Param() params: UpdateClassParamsDTO,
    @Body() body: UpdateClassBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Class> {
    return this.classesService.update(params, body, membership, user);
  }

  @Delete(':slug/classes/:classId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteClassParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.classesService.delete(params, membership, user);
  }
}
