import { Injectable } from '@nestjs/common';
import { IGradeLevelsService } from '../../grade-levels/services/i.grade-levels.service';
import { IRegistrationsService } from '../../registrations/services/i.registrations.service';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';

import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateEducationLevelBodyDTO } from '../dtos/create-education-level.dto';
import { DeleteEducationLevelParamsDTO } from '../dtos/delete-education-level.dto';
import { GetEducationLevelParamsDTO } from '../dtos/get-education-level.dto';
import {
  UpdateEducationLevelBodyDTO,
  UpdateEducationLevelParamsDTO,
} from '../dtos/update-education-level.dto';
import { EducationLevel } from '../models/education-level.model';
import { IEducationLevelsRepository } from '../repositories/i.education-levels.repository';

@Injectable()
export abstract class IEducationLevelsService {
  protected readonly educationLevelsRepository: IEducationLevelsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly gradeLevelsService: IGradeLevelsService;
  protected readonly registrationsService: IRegistrationsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    educationLevelsRepository: IEducationLevelsRepository,
    helperService: IHelpersService,
    gradeLevelsService: IGradeLevelsService,
    registrationsService: IRegistrationsService,
    reportCacheService: IReportCacheService,
  ) {
    this.educationLevelsRepository = educationLevelsRepository;
    this.helperService = helperService;
    this.gradeLevelsService = gradeLevelsService;
    this.registrationsService = registrationsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    body: CreateEducationLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<EducationLevel>;
  public abstract getById(
    params: GetEducationLevelParamsDTO,
    membership: Membership,
  ): Promise<EducationLevel>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<EducationLevel>>;
  public abstract update(
    params: UpdateEducationLevelParamsDTO,
    body: UpdateEducationLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<EducationLevel>;
  public abstract delete(
    params: DeleteEducationLevelParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
