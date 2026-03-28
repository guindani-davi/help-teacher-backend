import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IEducationLevelsService } from '../../../education-levels/services/i.education-levels.service';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IRegistrationsService } from '../../../registrations/services/i.registrations.service';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { CreateGradeLevelBodyDTO } from '../../dtos/create-grade-level.dto';
import { DeleteGradeLevelParamsDTO } from '../../dtos/delete-grade-level.dto';
import { GetGradeLevelParamsDTO } from '../../dtos/get-grade-level.dto';
import { GetGradeLevelsParamsDTO } from '../../dtos/get-grade-levels.dto';
import {
  UpdateGradeLevelBodyDTO,
  UpdateGradeLevelParamsDTO,
} from '../../dtos/update-grade-level.dto';
import { GradeLevel } from '../../models/grade-level.model';
import { IGradeLevelsRepository } from '../../repositories/i.grade-levels.repository';
import { IGradeLevelsService } from '../i.grade-levels.service';

@Injectable()
export class GradeLevelsService extends IGradeLevelsService {
  public constructor(
    @Inject(IGradeLevelsRepository)
    gradeLevelsRepository: IGradeLevelsRepository,
    @Inject(forwardRef(() => IEducationLevelsService))
    educationLevelsService: IEducationLevelsService,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => IRegistrationsService))
    registrationsService: IRegistrationsService,
    @Inject(forwardRef(() => IReportCacheService))
    reportCacheService: IReportCacheService,
  ) {
    super(
      gradeLevelsRepository,
      educationLevelsService,
      helperService,
      registrationsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateGradeLevelBodyDTO,
    educationLevelId: string,
    membership: Membership,
    user: JwtPayload,
  ): Promise<GradeLevel> {
    await this.educationLevelsService.getById(
      { slug: '', educationLevelId },
      membership,
    );

    return this.gradeLevelsRepository.create(
      body.name,
      educationLevelId,
      membership.organizationId,
      user.sub,
    );
  }

  public async getById(
    params: GetGradeLevelParamsDTO | string,
    membership: Membership | string,
  ): Promise<GradeLevel> {
    const gradeLevelId =
      typeof params === 'string' ? params : params.gradeLevelId;
    const organizationId =
      typeof membership === 'string' ? membership : membership.organizationId;

    return this.gradeLevelsRepository.getById(gradeLevelId, organizationId);
  }

  public async getByEducationLevel(
    params: GetGradeLevelsParamsDTO,
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<GradeLevel>> {
    await this.educationLevelsService.getById(
      { slug: params.slug, educationLevelId: params.educationLevelId },
      membership,
    );

    return this.gradeLevelsRepository.getByEducationLevelId(
      params.educationLevelId,
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateGradeLevelParamsDTO,
    body: UpdateGradeLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<GradeLevel> {
    await this.gradeLevelsRepository.getById(
      params.gradeLevelId,
      membership.organizationId,
    );

    const result = await this.gradeLevelsRepository.update(
      params.gradeLevelId,
      body.name,
      user.sub,
    );

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );

    return result;
  }

  public async delete(
    params: DeleteGradeLevelParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.gradeLevelsRepository.getById(
      params.gradeLevelId,
      membership.organizationId,
    );

    await this.registrationsService.deactivateByGradeLevelId(
      params.gradeLevelId,
      user.sub,
    );

    await this.gradeLevelsRepository.delete(params.gradeLevelId, user.sub);

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );
  }

  public async getActiveIdsByEducationLevelId(
    educationLevelId: string,
  ): Promise<string[]> {
    return this.gradeLevelsRepository.getActiveIdsByEducationLevelId(
      educationLevelId,
    );
  }

  public async deactivateByEducationLevelId(
    educationLevelId: string,
    userId: string,
  ): Promise<void> {
    await this.gradeLevelsRepository.deactivateByEducationLevelId(
      educationLevelId,
      userId,
    );
  }
}
