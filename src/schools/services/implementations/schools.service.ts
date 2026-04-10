import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IRegistrationsService } from '../../../registrations/services/i.registrations.service';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { CreateSchoolBodyDTO } from '../../dtos/create-school.dto';
import { DeleteSchoolParamsDTO } from '../../dtos/delete-school.dto';
import { GetSchoolParamsDTO } from '../../dtos/get-school.dto';
import {
  UpdateSchoolBodyDTO,
  UpdateSchoolParamsDTO,
} from '../../dtos/update-school.dto';
import { School } from '../../models/school.model';
import { ISchoolsRepository } from '../../repositories/i.schools.repository';
import { ISchoolsService } from '../i.schools.service';

@Injectable()
export class SchoolsService extends ISchoolsService {
  public constructor(
    @Inject(ISchoolsRepository) schoolsRepository: ISchoolsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => IRegistrationsService))
    registrationsService: IRegistrationsService,
    @Inject(forwardRef(() => IReportCacheService))
    reportCacheService: IReportCacheService,
  ) {
    super(
      schoolsRepository,
      helperService,
      registrationsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateSchoolBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<School> {
    return this.schoolsRepository.create(
      body.name,
      membership.organizationId,
      user.sub,
    );
  }

  public async getById(
    params: GetSchoolParamsDTO | string,
    membership: Membership | string,
  ): Promise<School> {
    const schoolId = typeof params === 'string' ? params : params.schoolId;
    const organizationId =
      typeof membership === 'string' ? membership : membership.organizationId;

    return this.schoolsRepository.getById(schoolId, organizationId);
  }

  public async getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<School>> {
    return this.schoolsRepository.getByOrganizationId(
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateSchoolParamsDTO,
    body: UpdateSchoolBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<School> {
    await this.schoolsRepository.getById(
      params.schoolId,
      membership.organizationId,
    );

    const result = await this.schoolsRepository.update(
      params.schoolId,
      body.name,
      user.sub,
    );

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );

    return result;
  }

  public async delete(
    params: DeleteSchoolParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.schoolsRepository.getById(
      params.schoolId,
      membership.organizationId,
    );

    await this.registrationsService.deactivateBySchoolId(
      params.schoolId,
      user.sub,
    );

    await this.schoolsRepository.delete(params.schoolId, user.sub);

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );
  }
}
