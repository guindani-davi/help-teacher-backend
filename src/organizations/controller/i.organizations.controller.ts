import type { JwtPayload } from '../../auth/payloads/jwt.payload';
import { CreateOrganizationBodyDTO } from '../dtos/create-organization.dto';
import { DeleteMemberParamsDTO } from '../dtos/delete-member.dto';
import { DeleteOrganizationParamsDTO } from '../dtos/delete-organization.dto';
import { GetMembersParamsDTO } from '../dtos/get-members.dto';
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
import { IOrganizationsService } from '../service/i.organizations.service';

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
  public abstract getMembership(membership: Membership): Promise<Membership>;
  public abstract getMembers(
    params: GetMembersParamsDTO,
  ): Promise<Membership[]>;
  public abstract updateMember(
    params: UpdateMemberParamsDTO,
    body: UpdateMemberBodyDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership>;
  public abstract deleteOrganization(
    params: DeleteOrganizationParamsDTO,
    user: JwtPayload,
  ): Promise<void>;
  public abstract deleteMember(
    params: DeleteMemberParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract transferOwnership(
    params: TransferOwnershipParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership>;
}
