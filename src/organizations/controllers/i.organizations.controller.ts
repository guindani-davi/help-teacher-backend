import type { JwtPayload } from '../../auth/models/jwt.model';
import { CreateOrganizationBodyDTO } from '../dtos/create-organization.dto';
import { DeleteOrganizationParamsDTO } from '../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../dtos/get-organization.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../dtos/update-organization.dto';
import { UploadLogoParamsDTO } from '../dtos/upload-logo.dto';
import { Organization } from '../models/organization.model';
import { IOrganizationsService } from '../services/i.organizations.service';

export abstract class IOrganizationsController {
  protected readonly organizationsService: IOrganizationsService;

  public constructor(organizationsService: IOrganizationsService) {
    this.organizationsService = organizationsService;
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
    params: UploadLogoParamsDTO,
    file: Express.Multer.File,
    user: JwtPayload,
  ): Promise<Organization>;
}
