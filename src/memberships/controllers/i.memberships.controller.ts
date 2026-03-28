import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { DeleteMemberParamsDTO } from '../dtos/delete-member.dto';
import { GetMembersParamsDTO } from '../dtos/get-members.dto';
import { TransferOwnershipParamsDTO } from '../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../dtos/update-member.dto';
import { Membership } from '../models/membership.model';
import { IMembershipsService } from '../services/i.memberships.service';

export abstract class IMembershipsController {
  protected readonly membershipsService: IMembershipsService;

  public constructor(membershipsService: IMembershipsService) {
    this.membershipsService = membershipsService;
  }

  public abstract getMembership(membership: Membership): Promise<Membership>;
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
}
