import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IGradeLevelsService } from '../../../grade-levels/services/i.grade-levels.service';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IRegistrationsService } from '../../../registrations/services/i.registrations.service';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { CreateEducationLevelBodyDTO } from '../../dtos/create-education-level.dto';
import { DeleteEducationLevelParamsDTO } from '../../dtos/delete-education-level.dto';
import { GetEducationLevelParamsDTO } from '../../dtos/get-education-level.dto';
import {
  UpdateEducationLevelBodyDTO,
  UpdateEducationLevelParamsDTO,
} from '../../dtos/update-education-level.dto';
import { EducationLevel } from '../../models/education-level.model';
import { IEducationLevelsRepository } from '../../repositories/i.education-levels.repository';
import { IEducationLevelsService } from '../i.education-levels.service';

@Injectable()
export class EducationLevelsService extends IEducationLevelsService {
  public constructor(
    @Inject(IEducationLevelsRepository)
    educationLevelsRepository: IEducationLevelsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => IGradeLevelsService))
    gradeLevelsService: IGradeLevelsService,
    @Inject(forwardRef(() => IRegistrationsService))
    registrationsService: IRegistrationsService,
    @Inject(forwardRef(() => IReportCacheService))
    reportCacheService: IReportCacheService,
  ) {
    super(
      educationLevelsRepository,
      helperService,
      gradeLevelsService,
      registrationsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateEducationLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<EducationLevel> {
    return this.educationLevelsRepository.create(
      body.name,
      membership.organizationId,
      user.sub,
    );
  }

  public async getById(
    params: GetEducationLevelParamsDTO,
    membership: Membership,
  ): Promise<EducationLevel> {
    return this.educationLevelsRepository.getById(
      params.educationLevelId,
      membership.organizationId,
    );
  }

  public async getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<EducationLevel>> {
    return this.educationLevelsRepository.getByOrganizationId(
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateEducationLevelParamsDTO,
    body: UpdateEducationLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<EducationLevel> {
    await this.educationLevelsRepository.getById(
      params.educationLevelId,
      membership.organizationId,
    );

    const result = await this.educationLevelsRepository.update(
      params.educationLevelId,
      body.name,
      user.sub,
    );

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );

    return result;
  }

  public async delete(
    params: DeleteEducationLevelParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.educationLevelsRepository.getById(
      params.educationLevelId,
      membership.organizationId,
    );

    const gradeLevelIds =
      await this.gradeLevelsService.getActiveIdsByEducationLevelId(
        params.educationLevelId,
      );

    await this.registrationsService.deactivateByGradeLevelIds(
      gradeLevelIds,
      user.sub,
    );

    await this.gradeLevelsService.deactivateByEducationLevelId(
      params.educationLevelId,
      user.sub,
    );

    await this.educationLevelsRepository.delete(
      params.educationLevelId,
      user.sub,
    );

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );
  }
}
