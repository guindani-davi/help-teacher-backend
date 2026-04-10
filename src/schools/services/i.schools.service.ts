import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { IRegistrationsService } from '../../registrations/services/i.registrations.service';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { CreateSchoolBodyDTO } from '../dtos/create-school.dto';
import { DeleteSchoolParamsDTO } from '../dtos/delete-school.dto';
import { GetSchoolParamsDTO } from '../dtos/get-school.dto';
import {
  UpdateSchoolBodyDTO,
  UpdateSchoolParamsDTO,
} from '../dtos/update-school.dto';
import { School } from '../models/school.model';
import { ISchoolsRepository } from '../repositories/i.schools.repository';

@Injectable()
export abstract class ISchoolsService {
  protected readonly schoolsRepository: ISchoolsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly registrationsService: IRegistrationsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    schoolsRepository: ISchoolsRepository,
    helperService: IHelpersService,
    registrationsService: IRegistrationsService,
    reportCacheService: IReportCacheService,
  ) {
    this.schoolsRepository = schoolsRepository;
    this.helperService = helperService;
    this.registrationsService = registrationsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    body: CreateSchoolBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<School>;
  public abstract getById(
    params: GetSchoolParamsDTO | string,
    membership: Membership | string,
  ): Promise<School>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<School>>;
  public abstract update(
    params: UpdateSchoolParamsDTO,
    body: UpdateSchoolBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<School>;
  public abstract delete(
    params: DeleteSchoolParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
