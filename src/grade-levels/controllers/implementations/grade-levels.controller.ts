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
import { CreateGradeLevelBodyDTO } from '../../dtos/create-grade-level.dto';
import { DeleteGradeLevelParamsDTO } from '../../dtos/delete-grade-level.dto';
import { GetGradeLevelParamsDTO } from '../../dtos/get-grade-level.dto';
import { GetGradeLevelsParamsDTO } from '../../dtos/get-grade-levels.dto';
import {
  UpdateGradeLevelBodyDTO,
  UpdateGradeLevelParamsDTO,
} from '../../dtos/update-grade-level.dto';
import { GradeLevel } from '../../models/grade-level.model';
import { IGradeLevelsService } from '../../services/i.grade-levels.service';
import { IGradeLevelsController } from '../i.grade-levels.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class GradeLevelsController extends IGradeLevelsController {
  public constructor(
    @Inject(IGradeLevelsService)
    gradeLevelsService: IGradeLevelsService,
  ) {
    super(gradeLevelsService);
  }

  @Post(':slug/education-levels/:educationLevelId/grade-levels')
  public async create(
    @Body() body: CreateGradeLevelBodyDTO,
    @Param('educationLevelId') educationLevelId: string,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<GradeLevel> {
    return this.gradeLevelsService.create(
      body,
      educationLevelId,
      membership,
      user,
    );
  }

  @Get(':slug/education-levels/:educationLevelId/grade-levels')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByEducationLevel(
    @Param() params: GetGradeLevelsParamsDTO,
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<GradeLevel>> {
    return this.gradeLevelsService.getByEducationLevel(
      params,
      membership,
      pagination,
    );
  }

  @Get(':slug/education-levels/:educationLevelId/grade-levels/:gradeLevelId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetGradeLevelParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<GradeLevel> {
    return this.gradeLevelsService.getById(params, membership);
  }

  @Patch(':slug/education-levels/:educationLevelId/grade-levels/:gradeLevelId')
  public async update(
    @Param() params: UpdateGradeLevelParamsDTO,
    @Body() body: UpdateGradeLevelBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<GradeLevel> {
    return this.gradeLevelsService.update(params, body, membership, user);
  }

  @Delete(':slug/education-levels/:educationLevelId/grade-levels/:gradeLevelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteGradeLevelParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.gradeLevelsService.delete(params, membership, user);
  }
}
