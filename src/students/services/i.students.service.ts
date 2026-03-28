import { Injectable } from '@nestjs/common';
import { IClassTopicsService } from 'src/class-topics/services/i.class-topics.service';
import { IClassesService } from 'src/classes/services/i.classes.service';
import { IRegistrationsService } from 'src/registrations/services/i.registrations.service';
import { IReportCacheService } from 'src/reports/services/i.report-cache.service';
import { IStudentUsersService } from 'src/student-users/services/i.student-users.service';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateStudentBodyDTO } from '../dtos/create-student.dto';
import { DeleteStudentParamsDTO } from '../dtos/delete-student.dto';
import { GetStudentParamsDTO } from '../dtos/get-student.dto';
import {
  UpdateStudentBodyDTO,
  UpdateStudentParamsDTO,
} from '../dtos/update-student.dto';
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
