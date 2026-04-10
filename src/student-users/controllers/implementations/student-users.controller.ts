import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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
import { Student } from '../../../students/models/student.model';
import { ActiveSubscriptionGuard } from '../../../subscriptions/guards/active-subscription.guard';
import { LinkStudentUserBodyDTO } from '../../dtos/link-student-user.dto';
import { UnlinkStudentUserParamsDTO } from '../../dtos/unlink-student-user.dto';
import { StudentUser } from '../../models/student-user.model';
import { IStudentUsersService } from '../../services/i.student-users.service';
import { IStudentUsersController } from '../i.student-users.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class StudentUsersController extends IStudentUsersController {
  public constructor(
    @Inject(IStudentUsersService) studentUsersService: IStudentUsersService,
  ) {
    super(studentUsersService);
  }

  @Get(':slug/students/my-students')
  @AllowedRoles(RolesEnum.RESPONSIBLE)
  public async getByUser(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponse<Student>> {
    return this.studentUsersService.getByUser(membership, pagination, user);
  }

  @Post(':slug/students/:studentId/users')
  public async create(
    @Param('studentId') studentId: string,
    @Body() body: LinkStudentUserBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<StudentUser> {
    return this.studentUsersService.create(studentId, body, membership, user);
  }

  @Delete(':slug/students/:studentId/users/:studentUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: UnlinkStudentUserParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.studentUsersService.delete(params, membership, user);
  }
}
