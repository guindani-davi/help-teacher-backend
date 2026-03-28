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
import { CreateStudentBodyDTO } from '../../dtos/create-student.dto';
import { DeleteStudentParamsDTO } from '../../dtos/delete-student.dto';
import { GetStudentParamsDTO } from '../../dtos/get-student.dto';
import {
  UpdateStudentBodyDTO,
  UpdateStudentParamsDTO,
} from '../../dtos/update-student.dto';
import { Student } from '../../models/student.model';
import { IStudentsService } from '../../services/i.students.service';
import { IStudentsController } from '../i.students.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class StudentsController extends IStudentsController {
  public constructor(
    @Inject(IStudentsService) studentsService: IStudentsService,
  ) {
    super(studentsService);
  }

  @Post(':slug/students')
  public async create(
    @Body() body: CreateStudentBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Student> {
    return this.studentsService.create(body, membership, user);
  }

  @Get(':slug/students')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>> {
    return this.studentsService.getByOrganization(membership, pagination);
  }

  @Get(':slug/students/:studentId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetStudentParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<Student> {
    return this.studentsService.getById(params, membership);
  }

  @Patch(':slug/students/:studentId')
  public async update(
    @Param() params: UpdateStudentParamsDTO,
    @Body() body: UpdateStudentBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Student> {
    return this.studentsService.update(params, body, membership, user);
  }

  @Delete(':slug/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteStudentParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.studentsService.delete(params, membership, user);
  }
}
