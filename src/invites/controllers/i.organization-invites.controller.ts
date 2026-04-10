import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import {
  CreateInviteBodyDTO,
  CreateInviteParamsDTO,
} from '../dtos/create-invite.dto';
import { GetOrganizationInvitesParamsDTO } from '../dtos/get-organization-invites.dto';
import { RevokeInviteParamsDTO } from '../dtos/revoke-invite.dto';
import { Invite } from '../models/invite.model';
import { IInvitesService } from '../services/i.invites.service';

export abstract class IOrganizationInvitesController {
  protected readonly invitesService: IInvitesService;

  public constructor(invitesService: IInvitesService) {
    this.invitesService = invitesService;
  }

  public abstract createInvite(
    params: CreateInviteParamsDTO,
    body: CreateInviteBodyDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Invite>;
  public abstract getOrganizationInvites(
    params: GetOrganizationInvitesParamsDTO,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>>;
  public abstract revokeInvite(params: RevokeInviteParamsDTO): Promise<void>;
}
