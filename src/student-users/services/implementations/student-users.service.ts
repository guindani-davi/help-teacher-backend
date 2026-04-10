import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { ForbiddenOperationException } from '../../../memberships/exceptions/forbidden-operation.exception';
import type { Membership } from '../../../memberships/models/membership.model';
import { IMembershipsService } from '../../../memberships/services/i.memberships.service';
import { Student } from '../../../students/models/student.model';
import { IStudentsService } from '../../../students/services/i.students.service';
import { LinkStudentUserBodyDTO } from '../../dtos/link-student-user.dto';
import { UnlinkStudentUserParamsDTO } from '../../dtos/unlink-student-user.dto';
import { StudentUser } from '../../models/student-user.model';
import { IStudentUsersRepository } from '../../repositories/i.student-users.repository';
import { IStudentUsersService } from '../i.student-users.service';

@Injectable()
export class StudentUsersService extends IStudentUsersService {
  public constructor(
    @Inject(IStudentUsersRepository)
    studentUsersRepository: IStudentUsersRepository,
    @Inject(forwardRef(() => IStudentsService))
    studentsService: IStudentsService,
    @Inject(IMembershipsService) membershipsService: IMembershipsService,
  ) {
    super(studentUsersRepository, studentsService, membershipsService);
  }

  public async create(
    studentId: string,
    body: LinkStudentUserBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<StudentUser> {
    await Promise.all([
      this.studentsService.getById(studentId, membership.organizationId),
      this.membershipsService.isUserMember(
        body.userId,
        membership.organizationId,
      ),
    ]);

    const result = await this.studentUsersRepository.create(
      studentId,
      body.userId,
      user.sub,
    );

    await this.membershipsService.addRoleToMember(
      body.userId,
      membership.organizationId,
      RolesEnum.RESPONSIBLE,
      user.sub,
    );

    return result;
  }

  public async delete(
    params: UnlinkStudentUserParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.studentsService.getById(
      params.studentId,
      membership.organizationId,
    );

    const studentUser = await this.studentUsersRepository.getById(
      params.studentUserId,
    );

    if (studentUser.studentId !== params.studentId) {
      throw new ForbiddenOperationException(
        'Student-user link does not belong to this student',
        'errors.studentUserNotLinked',
      );
    }

    await this.studentUsersRepository.delete(params.studentUserId, user.sub);

    await this.handleOrphanedRole(
      studentUser.userId,
      membership.organizationId,
      user.sub,
    );
  }

  public async getByUser(
    membership: Membership,
    pagination: PaginationQueryDTO,
    user: JwtPayload,
  ): Promise<PaginatedResponse<Student>> {
    return this.studentUsersRepository.getStudentsByUserId(
      user.sub,
      membership.organizationId,
      pagination,
    );
  }

  public async deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void> {
    await this.studentUsersRepository.deactivateByStudentId(studentId, userId);
  }

  public async deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.studentUsersRepository.deactivateByOrganizationId(
      organizationId,
      userId,
    );
  }

  public async getActiveUserIdsForStudent(
    studentId: string,
  ): Promise<string[]> {
    return this.studentUsersRepository.getActiveUserIdsForStudent(studentId);
  }

  public async handleOrphanedRole(
    userId: string,
    organizationId: string,
    actorId: string,
  ): Promise<void> {
    const remainingLinks = await this.studentUsersRepository.countActiveForUser(
      userId,
      organizationId,
    );

    if (remainingLinks === 0) {
      await this.membershipsService.removeRoleFromMember(
        userId,
        organizationId,
        RolesEnum.RESPONSIBLE,
        actorId,
      );
    }
  }
}
