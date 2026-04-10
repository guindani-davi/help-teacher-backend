import { RolesEnum } from '../../auth/enums/roles.enum';
import { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { DeleteMemberParamsDTO } from '../dtos/delete-member.dto';
import { TransferOwnershipParamsDTO } from '../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../dtos/update-member.dto';
import { Membership } from '../models/membership.model';

export abstract class IMembershipsRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract getMembership(
    organizationId: string,
    user: JwtPayload,
  ): Promise<Membership>;
  public abstract getMembershipBySlug(
    slug: string,
    userId: string,
  ): Promise<Membership>;
  public abstract getMembers(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Membership>>;
  public abstract updateMember(
    params: UpdateMemberParamsDTO,
    body: UpdateMemberBodyDTO,
    user: JwtPayload,
  ): Promise<Membership>;
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
  public abstract isUserMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean>;
  public abstract createMembership(
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
