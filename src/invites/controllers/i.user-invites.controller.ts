import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { AcceptInviteParamsDTO } from '../dtos/accept-invite.dto';
import { GetInviteParamsDTO } from '../dtos/get-invite.dto';
import { RejectInviteParamsDTO } from '../dtos/reject-invite.dto';
import { Invite } from '../models/invite.model';
import { IInvitesService } from '../services/i.invites.service';

export abstract class IUserInvitesController {
  protected readonly invitesService: IInvitesService;

  public constructor(invitesService: IInvitesService) {
    this.invitesService = invitesService;
  }

  public abstract getPendingInvites(
    user: JwtPayload,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>>;
  public abstract getInviteById(
    params: GetInviteParamsDTO,
    user: JwtPayload,
  ): Promise<Invite>;
  public abstract acceptInvite(
    params: AcceptInviteParamsDTO,
    user: JwtPayload,
  ): Promise<void>;
  public abstract rejectInvite(
    params: RejectInviteParamsDTO,
    user: JwtPayload,
  ): Promise<void>;
}
