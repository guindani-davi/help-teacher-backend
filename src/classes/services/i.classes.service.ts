import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { IClassTopicsService } from '../../class-topics/services/i.class-topics.service';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { IMembershipsService } from '../../memberships/services/i.memberships.service';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { ISchedulesService } from '../../schedules/services/i.schedules.service';
import { IStudentsService } from '../../students/services/i.students.service';
import { CreateClassBodyDTO } from '../dtos/create-class.dto';
import { DeleteClassParamsDTO } from '../dtos/delete-class.dto';
import { GetClassParamsDTO } from '../dtos/get-class.dto';
import {
  UpdateClassBodyDTO,
  UpdateClassParamsDTO,
} from '../dtos/update-class.dto';
import { ClassDetail } from '../models/class-detail.model';
import { Class } from '../models/class.model';
import { IClassesRepository } from '../repositories/i.classes.repository';

@Injectable()
export abstract class IClassesService {
  protected readonly classesRepository: IClassesRepository;
  protected readonly helperService: IHelpersService;
  protected readonly schedulesService: ISchedulesService;
  protected readonly studentsService: IStudentsService;
  protected readonly classTopicsService: IClassTopicsService;
  protected readonly reportCacheService: IReportCacheService;
  protected readonly membershipsService: IMembershipsService;

  public constructor(
    classesRepository: IClassesRepository,
    helperService: IHelpersService,
    schedulesService: ISchedulesService,
    studentsService: IStudentsService,
    classTopicsService: IClassTopicsService,
    reportCacheService: IReportCacheService,
    membershipsService: IMembershipsService,
  ) {
    this.classesRepository = classesRepository;
    this.helperService = helperService;
    this.schedulesService = schedulesService;
    this.studentsService = studentsService;
    this.classTopicsService = classTopicsService;
    this.reportCacheService = reportCacheService;
    this.membershipsService = membershipsService;
  }

  public abstract create(
    body: CreateClassBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Class>;
  public abstract getById(
    params: GetClassParamsDTO | string,
    membership: Membership | string,
  ): Promise<Class>;
  public abstract getDetails(
    params: GetClassParamsDTO,
    membership: Membership,
  ): Promise<ClassDetail>;
  public abstract getByStudentId(
    studentId: string,
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<ClassDetail>>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Class>>;
  public abstract update(
    params: UpdateClassParamsDTO,
    body: UpdateClassBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Class>;
  public abstract delete(
    params: DeleteClassParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getActiveIdsByStudentId(studentId: string): Promise<string[]>;
  public abstract deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void>;
  public abstract getActiveIdsByScheduleId(
    scheduleId: string,
  ): Promise<string[]>;
  public abstract deactivateByScheduleId(
    scheduleId: string,
    userId: string,
  ): Promise<void>;
}
