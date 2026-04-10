import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { IStorageService } from '../../storage/services/i.storage.service';
import { ISubscriptionsService } from '../../subscriptions/services/i.subscriptions.service';
import { CreateOrganizationBodyDTO } from '../dtos/create-organization.dto';
import { DeleteOrganizationParamsDTO } from '../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../dtos/get-organization.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../dtos/update-organization.dto';
import { Organization } from '../models/organization.model';
import { IOrganizationsRepository } from '../repositories/i.organizations.repository';

@Injectable()
export abstract class IOrganizationsService {
  protected readonly organizationsRepository: IOrganizationsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly storageService: IStorageService;
  protected readonly reportCacheService: IReportCacheService;
  protected readonly subscriptionsService: ISubscriptionsService;

  public constructor(
    organizationsRepository: IOrganizationsRepository,
    helperService: IHelpersService,
    storageService: IStorageService,
    reportCacheService: IReportCacheService,
    subscriptionsService: ISubscriptionsService,
  ) {
    this.organizationsRepository = organizationsRepository;
    this.helperService = helperService;
    this.storageService = storageService;
    this.reportCacheService = reportCacheService;
    this.subscriptionsService = subscriptionsService;
  }

  public abstract createOrganization(
    body: CreateOrganizationBodyDTO,
    user: JwtPayload,
  ): Promise<Organization>;
  public abstract getOrganizationBySlug(
    params: GetOrganizationBySlugParamsDTO,
  ): Promise<Organization>;
  public abstract updateOrganization(
    params: UpdateOrganizationBySlugParamsDTO,
    body: UpdateOrganizationBySlugBodyDTO,
    user: JwtPayload,
  ): Promise<Organization>;
  public abstract deleteOrganization(
    params: DeleteOrganizationParamsDTO,
    user: JwtPayload,
  ): Promise<void>;
  public abstract uploadLogo(
    slug: string,
    file: Express.Multer.File,
    user: JwtPayload,
  ): Promise<Organization>;
}
