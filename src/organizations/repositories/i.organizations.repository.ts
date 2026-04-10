import { JwtPayload } from '../../auth/models/jwt.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { CreateOrganizationBodyDTO } from '../dtos/create-organization.dto';
import { DeleteOrganizationParamsDTO } from '../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../dtos/get-organization.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../dtos/update-organization.dto';
import { Organization } from '../models/organization.model';

export abstract class IOrganizationsRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract createOrganization(
    body: CreateOrganizationBodyDTO,
    slug: string,
    user: JwtPayload,
  ): Promise<Organization>;
  public abstract getOrganizationBySlug(
    params: GetOrganizationBySlugParamsDTO,
  ): Promise<Organization>;
  public abstract updateOrganization(
    params: UpdateOrganizationBySlugParamsDTO,
    body: UpdateOrganizationBySlugBodyDTO,
    newSlug: string | null,
    user: JwtPayload,
  ): Promise<Organization>;
  public abstract slugExists(slug: string): Promise<boolean>;
  public abstract deleteOrganization(
    params: DeleteOrganizationParamsDTO,
    user: JwtPayload,
  ): Promise<void>;
  public abstract updateLogo(
    organizationId: string,
    logoUrl: string,
    userId: string,
  ): Promise<Organization>;
  public abstract countActiveByOwner(userId: string): Promise<number>;
}
