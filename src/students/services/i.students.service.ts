import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { IClassTopicsService } from '../../class-topics/services/i.class-topics.service';
import { IClassesService } from '../../classes/services/i.classes.service';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { IRegistrationsService } from '../../registrations/services/i.registrations.service';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { IStudentUsersService } from '../../student-users/services/i.student-users.service';
import { CreateStudentBodyDTO } from '../dtos/create-student.dto';
import { DeleteStudentParamsDTO } from '../dtos/delete-student.dto';
import { GetStudentParamsDTO } from '../dtos/get-student.dto';
import {
  UpdateStudentBodyDTO,
  UpdateStudentParamsDTO,
} from '../dtos/update-student.dto';
import { StudentDetail } from '../models/student-detail.model';
import { Student } from '../models/student.model';
import { IStudentsRepository } from '../repositories/i.students.repository';

@Injectable()
export abstract class IStudentsService {
  protected readonly studentsRepository: IStudentsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly studentUsersService: IStudentUsersService;
  protected readonly registrationsService: IRegistrationsService;
  protected readonly classesService: IClassesService;
  protected readonly classTopicsService: IClassTopicsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    studentsRepository: IStudentsRepository,
    helperService: IHelpersService,
    studentUsersService: IStudentUsersService,
    registrationsService: IRegistrationsService,
    classesService: IClassesService,
    classTopicsService: IClassTopicsService,
    reportCacheService: IReportCacheService,
  ) {
    this.studentsRepository = studentsRepository;
    this.helperService = helperService;
    this.studentUsersService = studentUsersService;
    this.registrationsService = registrationsService;
    this.classesService = classesService;
    this.classTopicsService = classTopicsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    body: CreateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student>;
  public abstract getById(
    params: GetStudentParamsDTO | string,
    membership: Membership | string,
  ): Promise<Student>;
  public abstract getDetails(
    params: GetStudentParamsDTO,
    membership: Membership,
  ): Promise<StudentDetail>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>>;
  public abstract update(
    params: UpdateStudentParamsDTO,
    body: UpdateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student>;
  public abstract delete(
    params: DeleteStudentParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
