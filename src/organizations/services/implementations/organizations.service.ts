import { Inject, Injectable } from '@nestjs/common';
import { JwtPayload } from '../../../auth/models/jwt.model';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { StorageBucket } from '../../../storage/enums/storage-bucket.enum';
import { IStorageService } from '../../../storage/services/i.storage.service';
import { CreateOrganizationBodyDTO } from '../../dtos/create-organization.dto';
import { DeleteOrganizationParamsDTO } from '../../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../../dtos/get-organization.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../../dtos/update-organization.dto';
import { SlugAlreadyExistsException } from '../../exceptions/slug-already-exists.exception';
import { Organization } from '../../models/organization.model';
import { IOrganizationsRepository } from '../../repositories/i.organizations.repository';
import { IOrganizationsService } from '../i.organizations.service';

@Injectable()
export class OrganizationsService extends IOrganizationsService {
  public constructor(
    @Inject(IOrganizationsRepository)
    organizationsRepository: IOrganizationsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(IStorageService) storageService: IStorageService,
    @Inject(IReportCacheService)
    reportCacheService: IReportCacheService,
  ) {
    super(
      organizationsRepository,
      helperService,
      storageService,
      reportCacheService,
    );
  }

  public async createOrganization(
    body: CreateOrganizationBodyDTO,
    user: JwtPayload,
  ): Promise<Organization> {
    const slug = await this.generateUniqueSlug(body.name);

    return this.organizationsRepository.createOrganization(body, slug, user);
  }

  public async getOrganizationBySlug(
    params: GetOrganizationBySlugParamsDTO,
  ): Promise<Organization> {
    return this.organizationsRepository.getOrganizationBySlug(params);
  }

  public async updateOrganization(
    params: UpdateOrganizationBySlugParamsDTO,
    body: UpdateOrganizationBySlugBodyDTO,
    user: JwtPayload,
  ): Promise<Organization> {
    let newSlug: string | null = null;

    if (body.name) {
      newSlug = await this.generateUniqueSlug(body.name);
    }

    const organization = await this.organizationsRepository.updateOrganization(
      params,
      body,
      newSlug,
      user,
    );

    await this.reportCacheService.invalidateAllForOrg(organization.id);

    return organization;
  }

  public async deleteOrganization(
    params: DeleteOrganizationParamsDTO,
    user: JwtPayload,
  ): Promise<void> {
    await this.organizationsRepository.deleteOrganization(params, user);
  }

  public async uploadLogo(
    slug: string,
    file: Express.Multer.File,
    user: JwtPayload,
  ): Promise<Organization> {
    const organization =
      await this.organizationsRepository.getOrganizationBySlug({ slug });

    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const path = `${organization.id}/logo.${extension}`;

    await this.storageService.upload(
      StorageBucket.ORGANIZATION_LOGOS,
      path,
      file.buffer,
      file.mimetype,
    );

    const logoUrl = this.storageService.getPublicUrl(
      StorageBucket.ORGANIZATION_LOGOS,
      path,
    );

    const cacheBustedUrl = `${logoUrl}?t=${Date.now()}`;

    await this.reportCacheService.invalidateAllForOrg(organization.id);

    return this.organizationsRepository.updateLogo(
      organization.id,
      cacheBustedUrl,
      user.sub,
    );
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.helperService.generateSlug(name);
    let slug = baseSlug;
    let suffix = 2;

    while (await this.organizationsRepository.slugExists(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    if (suffix > 100) {
      throw new SlugAlreadyExistsException();
    }

    return slug;
  }
}
