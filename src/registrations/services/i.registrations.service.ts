import { Injectable } from '@nestjs/common';
import { IGradeLevelsService } from '../../grade-levels/services/i.grade-levels.service';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { ISchoolsService } from '../../schools/services/i.schools.service';
import { IStudentsService } from '../../students/services/i.students.service';

import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateRegistrationBodyDTO } from '../dtos/create-registration.dto';
import { DeleteRegistrationParamsDTO } from '../dtos/delete-registration.dto';
import { GetRegistrationParamsDTO } from '../dtos/get-registration.dto';
import {
  UpdateRegistrationBodyDTO,
  UpdateRegistrationParamsDTO,
} from '../dtos/update-registration.dto';
import { Registration } from '../models/registration.model';
import { IRegistrationsRepository } from '../repositories/i.registrations.repository';

@Injectable()
export abstract class IRegistrationsService {
  protected readonly registrationsRepository: IRegistrationsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly studentsService: IStudentsService;
  protected readonly schoolsService: ISchoolsService;
  protected readonly gradeLevelsService: IGradeLevelsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    registrationsRepository: IRegistrationsRepository,
    helperService: IHelpersService,
    studentsService: IStudentsService,
    schoolsService: ISchoolsService,
    gradeLevelsService: IGradeLevelsService,
    reportCacheService: IReportCacheService,
  ) {
    this.registrationsRepository = registrationsRepository;
    this.helperService = helperService;
    this.studentsService = studentsService;
    this.schoolsService = schoolsService;
    this.gradeLevelsService = gradeLevelsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    body: CreateRegistrationBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Registration>;
  public abstract getById(
    params: GetRegistrationParamsDTO,
    membership: Membership,
  ): Promise<Registration>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Registration>>;
  public abstract update(
    params: UpdateRegistrationParamsDTO,
    body: UpdateRegistrationBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Registration>;
  public abstract delete(
    params: DeleteRegistrationParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateBySchoolId(
    schoolId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByGradeLevelId(
    gradeLevelId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByGradeLevelIds(
    gradeLevelIds: string[],
    userId: string,
  ): Promise<void>;
}
