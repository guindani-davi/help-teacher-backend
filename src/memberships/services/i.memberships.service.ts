import { Injectable } from '@nestjs/common';
import { RolesEnum } from '../../auth/enums/roles.enum';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IOrganizationsService } from '../../organizations/services/i.organizations.service';
import { DeleteMemberParamsDTO } from '../dtos/delete-member.dto';
import { GetMembersParamsDTO } from '../dtos/get-members.dto';
import { GetMembershipParamsDTO } from '../dtos/get-membership.dto';
import { TransferOwnershipParamsDTO } from '../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../dtos/update-member.dto';
import { Membership } from '../models/membership.model';
import { IMembershipsRepository } from '../repositories/i.memberships.repository';

@Injectable()
export abstract class IMembershipsService {
  protected readonly membershipsRepository: IMembershipsRepository;
  protected readonly organizationsService: IOrganizationsService;

  public constructor(
    membershipsRepository: IMembershipsRepository,
    organizationsService: IOrganizationsService,
  ) {
    this.membershipsRepository = membershipsRepository;
    this.organizationsService = organizationsService;
  }

  public abstract getMembership(
    params: GetMembershipParamsDTO,
    user: JwtPayload,
  ): Promise<Membership>;
  public abstract getMembershipBySlug(
    slug: string,
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
  public abstract addRoleToMember(
    userId: string,
    organizationId: string,
    role: RolesEnum,
    updatedBy: string,
  ): Promise<void>;
  public abstract removeRoleFromMember(
    userId: string,
    organizationId: string,
    role: RolesEnum,
    updatedBy: string,
  ): Promise<void>;
  public abstract hasRole(
    userId: string,
    organizationId: string,
    role: RolesEnum,
  ): Promise<boolean>;
}
