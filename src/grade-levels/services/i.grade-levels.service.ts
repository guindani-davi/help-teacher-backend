import { Injectable } from '@nestjs/common';
import { IRegistrationsService } from 'src/registrations/services/i.registrations.service';
import { IReportCacheService } from 'src/reports/services/i.report-cache.service';

import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IEducationLevelsService } from '../../education-levels/services/i.education-levels.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateGradeLevelBodyDTO } from '../dtos/create-grade-level.dto';
import { DeleteGradeLevelParamsDTO } from '../dtos/delete-grade-level.dto';
import { GetGradeLevelParamsDTO } from '../dtos/get-grade-level.dto';
import { GetGradeLevelsParamsDTO } from '../dtos/get-grade-levels.dto';
import {
  UpdateGradeLevelBodyDTO,
  UpdateGradeLevelParamsDTO,
} from '../dtos/update-grade-level.dto';
import { GradeLevel } from '../models/grade-level.model';
import { IGradeLevelsRepository } from '../repositories/i.grade-levels.repository';

@Injectable()
export abstract class IGradeLevelsService {
  protected readonly gradeLevelsRepository: IGradeLevelsRepository;
  protected readonly educationLevelsService: IEducationLevelsService;
  protected readonly helperService: IHelpersService;
  protected readonly registrationsService: IRegistrationsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    gradeLevelsRepository: IGradeLevelsRepository,
    educationLevelsService: IEducationLevelsService,
    helperService: IHelpersService,
    registrationsService: IRegistrationsService,
    reportCacheService: IReportCacheService,
  ) {
    this.gradeLevelsRepository = gradeLevelsRepository;
    this.educationLevelsService = educationLevelsService;
    this.helperService = helperService;
    this.registrationsService = registrationsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    params: CreateGradeLevelBodyDTO,
    educationLevelId: string,
    membership: Membership,
    user: JwtPayload,
  ): Promise<GradeLevel>;
  public abstract getById(
    params: GetGradeLevelParamsDTO | string,
    membership: Membership | string,
  ): Promise<GradeLevel>;
  public abstract getByEducationLevel(
    params: GetGradeLevelsParamsDTO,
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<GradeLevel>>;
  public abstract update(
    params: UpdateGradeLevelParamsDTO,
    body: UpdateGradeLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<GradeLevel>;
  public abstract delete(
    params: DeleteGradeLevelParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getActiveIdsByEducationLevelId(
    educationLevelId: string,
  ): Promise<string[]>;
  public abstract deactivateByEducationLevelId(
    educationLevelId: string,
    userId: string,
  ): Promise<void>;
}
