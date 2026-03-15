import { Injectable } from '@nestjs/common';
import { RolesEnum } from '../../auth/enums/roles.enum';
import type { JwtPayload } from '../../auth/payloads/jwt.payload';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import { IHelpersService } from '../../helpers/service/i.helpers.service';
import { ISubscriptionsService } from '../../subscriptions/service/i.subscriptions.service';
import { CreateOrganizationBodyDTO } from '../dtos/create-organization.dto';
import { DeleteMemberParamsDTO } from '../dtos/delete-member.dto';
import { DeleteOrganizationParamsDTO } from '../dtos/delete-organization.dto';
import { GetMembersParamsDTO } from '../dtos/get-members.dto';
import { GetMembershipParamsDTO } from '../dtos/get-membership.dto';
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
import { IOrganizationsRepository } from '../repository/i.organizations.repository';

@Injectable()
export abstract class IOrganizationsService {
  protected readonly organizationsRepository: IOrganizationsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly subscriptionsService: ISubscriptionsService;

  public constructor(
    organizationsRepository: IOrganizationsRepository,
    helperService: IHelpersService,
    subscriptionsService: ISubscriptionsService,
  ) {
    this.organizationsRepository = organizationsRepository;
    this.helperService = helperService;
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
  public abstract getMembership(
    params: GetMembershipParamsDTO,
    user: JwtPayload,
  ): Promise<Membership>;
  public abstract getMembers(
    params: GetMembersParamsDTO,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Membership>>;
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
  public abstract isUserMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean>;
  public abstract addMember(
    userId: string,
    organizationId: string,
    roles: RolesEnum[],
    createdBy: string,
  ): Promise<void>;
  protected abstract generateUniqueSlug(name: string): Promise<string>;
}
