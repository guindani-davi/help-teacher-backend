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
import { CreateEducationLevelBodyDTO } from '../../dtos/create-education-level.dto';
import { DeleteEducationLevelParamsDTO } from '../../dtos/delete-education-level.dto';
import { GetEducationLevelParamsDTO } from '../../dtos/get-education-level.dto';
import {
  UpdateEducationLevelBodyDTO,
  UpdateEducationLevelParamsDTO,
} from '../../dtos/update-education-level.dto';
import { EducationLevel } from '../../models/education-level.model';
import { IEducationLevelsService } from '../../services/i.education-levels.service';
import { IEducationLevelsController } from '../i.education-levels.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class EducationLevelsController extends IEducationLevelsController {
  public constructor(
    @Inject(IEducationLevelsService)
    educationLevelsService: IEducationLevelsService,
  ) {
    super(educationLevelsService);
  }

  @Post(':slug/education-levels')
  public async create(
    @Body() body: CreateEducationLevelBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<EducationLevel> {
    return this.educationLevelsService.create(body, membership, user);
  }

  @Get(':slug/education-levels')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<EducationLevel>> {
    return this.educationLevelsService.getByOrganization(
      membership,
      pagination,
    );
  }

  @Get(':slug/education-levels/:educationLevelId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetEducationLevelParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<EducationLevel> {
    return this.educationLevelsService.getById(params, membership);
  }

  @Patch(':slug/education-levels/:educationLevelId')
  public async update(
    @Param() params: UpdateEducationLevelParamsDTO,
    @Body() body: UpdateEducationLevelBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<EducationLevel> {
    return this.educationLevelsService.update(params, body, membership, user);
  }

  @Delete(':slug/education-levels/:educationLevelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteEducationLevelParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.educationLevelsService.delete(params, membership, user);
  }
}
