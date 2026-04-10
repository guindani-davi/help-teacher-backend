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
import { CreateSubjectBodyDTO } from '../../dtos/create-subject.dto';
import { DeleteSubjectParamsDTO } from '../../dtos/delete-subject.dto';
import { GetSubjectParamsDTO } from '../../dtos/get-subject.dto';
import {
  UpdateSubjectBodyDTO,
  UpdateSubjectParamsDTO,
} from '../../dtos/update-subject.dto';
import { Subject } from '../../models/subject.model';
import { ISubjectsService } from '../../services/i.subjects.service';
import { ISubjectsController } from '../i.subjects.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class SubjectsController extends ISubjectsController {
  public constructor(
    @Inject(ISubjectsService) subjectsService: ISubjectsService,
  ) {
    super(subjectsService);
  }

  @Post(':slug/subjects')
  public async create(
    @Body() body: CreateSubjectBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Subject> {
    return this.subjectsService.create(body, membership, user);
  }

  @Get(':slug/subjects')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Subject>> {
    return this.subjectsService.getByOrganization(membership, pagination);
  }

  @Get(':slug/subjects/:subjectId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetSubjectParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<Subject> {
    return this.subjectsService.getById(params, membership);
  }

  @Patch(':slug/subjects/:subjectId')
  public async update(
    @Param() params: UpdateSubjectParamsDTO,
    @Body() body: UpdateSubjectBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Subject> {
    return this.subjectsService.update(params, body, membership, user);
  }

  @Delete(':slug/subjects/:subjectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteSubjectParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.subjectsService.delete(params, membership, user);
  }
}
