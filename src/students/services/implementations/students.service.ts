import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { IClassTopicsService } from '../../../class-topics/services/i.class-topics.service';
import { IClassesService } from '../../../classes/services/i.classes.service';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IRegistrationsService } from '../../../registrations/services/i.registrations.service';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { IStudentUsersService } from '../../../student-users/services/i.student-users.service';
import { CreateStudentBodyDTO } from '../../dtos/create-student.dto';
import { DeleteStudentParamsDTO } from '../../dtos/delete-student.dto';
import { GetStudentParamsDTO } from '../../dtos/get-student.dto';
import {
  UpdateStudentBodyDTO,
  UpdateStudentParamsDTO,
} from '../../dtos/update-student.dto';
import { StudentDetail } from '../../models/student-detail.model';
import { Student } from '../../models/student.model';
import { IStudentsRepository } from '../../repositories/i.students.repository';
import { IStudentsService } from '../i.students.service';

@Injectable()
export class StudentsService extends IStudentsService {
  public constructor(
    @Inject(IStudentsRepository) studentsRepository: IStudentsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => IStudentUsersService))
    studentUsersService: IStudentUsersService,
    @Inject(forwardRef(() => IRegistrationsService))
    registrationsService: IRegistrationsService,
    @Inject(forwardRef(() => IClassesService))
    classesService: IClassesService,
    @Inject(IClassTopicsService) classTopicsService: IClassTopicsService,
    @Inject(IReportCacheService) reportCacheService: IReportCacheService,
  ) {
    super(
      studentsRepository,
      helperService,
      studentUsersService,
      registrationsService,
      classesService,
      classTopicsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student> {
    return this.studentsRepository.create(
      body.name,
      body.surname,
      membership.organizationId,
      user.sub,
    );
  }

  public async getById(
    params: GetStudentParamsDTO | string,
    membership: Membership | string,
  ): Promise<Student> {
    const studentId = typeof params === 'string' ? params : params.studentId;
    const organizationId =
      typeof membership === 'string' ? membership : membership.organizationId;

    return this.studentsRepository.getById(studentId, organizationId);
  }

  public async getDetails(
    params: GetStudentParamsDTO,
    membership: Membership,
  ): Promise<StudentDetail> {
    return this.studentsRepository.getDetailById(
      params.studentId,
      membership.organizationId,
    );
  }

  public async getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>> {
    return this.studentsRepository.getByOrganizationId(
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateStudentParamsDTO,
    body: UpdateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student> {
    await this.studentsRepository.getById(
      params.studentId,
      membership.organizationId,
    );

    const updated = await this.studentsRepository.update(
      params.studentId,
      body.name,
      body.surname,
      user.sub,
    );

    await this.reportCacheService.invalidateCache(
      membership.organizationId,
      params.studentId,
    );

    return updated;
  }

  public async delete(
    params: DeleteStudentParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.studentsRepository.getById(
      params.studentId,
      membership.organizationId,
    );

    const userIds = await this.studentUsersService.getActiveUserIdsForStudent(
      params.studentId,
    );

    await this.studentUsersService.deactivateByStudentId(
      params.studentId,
      user.sub,
    );

    for (const linkedUserId of userIds) {
      await this.studentUsersService.handleOrphanedRole(
        linkedUserId,
        membership.organizationId,
        user.sub,
      );
    }

    await this.registrationsService.deactivateByStudentId(
      params.studentId,
      user.sub,
    );

    const classIds = await this.classesService.getActiveIdsByStudentId(
      params.studentId,
    );

    await this.classTopicsService.deactivateByClassIds(classIds, user.sub);

    await this.classesService.deactivateByStudentId(params.studentId, user.sub);

    await this.studentsRepository.delete(params.studentId, user.sub);

    await this.reportCacheService.invalidateCache(
      membership.organizationId,
      params.studentId,
    );
  }
}
