import { JwtPayload } from '../../auth/payloads/jwt.payload';
import { IDatabaseService } from '../../database/service/i.database.service';
import { Database } from '../../database/types';
import { IHelpersService } from '../../helpers/service/i.helpers.service';
import { CreateOrganizationBodyDTO } from '../dtos/create-organization.dto';
import { DeleteMemberParamsDTO } from '../dtos/delete-member.dto';
import { DeleteOrganizationParamsDTO } from '../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../dtos/get-organization.dto';
import { TransferOwnershipParamsDTO } from '../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../dtos/update-member.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../dtos/update-organization.dto';
import { Membership } from '../model/membership.model';
import { Organization } from '../model/organization.model';

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
  public abstract getMembership(
    organizationId: string,
    user: JwtPayload,
  ): Promise<Membership>;
  public abstract getMembers(organizationId: string): Promise<Membership[]>;
  public abstract updateMember(
    params: UpdateMemberParamsDTO,
    body: UpdateMemberBodyDTO,
    user: JwtPayload,
  ): Promise<Membership>;
  public abstract deleteOrganization(
    params: DeleteOrganizationParamsDTO,
    user: JwtPayload,
  ): Promise<void>;
  public abstract deleteMember(
    params: DeleteMemberParamsDTO,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getMembershipById(membershipId: string): Promise<Membership>;
  public abstract transferOwnership(
    params: TransferOwnershipParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership>;
  protected abstract mapToEntity(
    data: Database['public']['Tables']['organizations']['Row'],
  ): Organization;
  protected abstract mapToMembershipEntity(
    data: Database['public']['Tables']['memberships']['Row'],
  ): Membership;
}
