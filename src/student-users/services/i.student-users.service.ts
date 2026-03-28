import { Injectable } from '@nestjs/common';
import { IMembershipsService } from 'src/memberships/services/i.memberships.service';
import { IStudentsService } from 'src/students/services/i.students.service';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { Student } from '../../students/models/student.model';
import { LinkStudentUserBodyDTO } from '../dtos/link-student-user.dto';
import { UnlinkStudentUserParamsDTO } from '../dtos/unlink-student-user.dto';
import { StudentUser } from '../models/student-user.model';
import { IStudentUsersRepository } from '../repositories/i.student-users.repository';

@Injectable()
export abstract class IStudentUsersService {
  protected readonly studentUsersRepository: IStudentUsersRepository;
  protected readonly studentsService: IStudentsService;
  protected readonly membershipsService: IMembershipsService;

  public constructor(
    studentUsersRepository: IStudentUsersRepository,
    studentsService: IStudentsService,
    membershipsService: IMembershipsService,
  ) {
    this.studentUsersRepository = studentUsersRepository;
    this.studentsService = studentsService;
    this.membershipsService = membershipsService;
  }

  public abstract create(
    studentId: string,
    body: LinkStudentUserBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<StudentUser>;
  public abstract delete(
    params: UnlinkStudentUserParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getByUser(
    membership: Membership,
    pagination: PaginationQueryDTO,
    user: JwtPayload,
  ): Promise<PaginatedResponse<Student>>;
  public abstract deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract getActiveUserIdsForStudent(
    studentId: string,
  ): Promise<string[]>;
  public abstract handleOrphanedRole(
    userId: string,
    organizationId: string,
    actorId: string,
  ): Promise<void>;
}
