import { RolesEnum } from '../../auth/enums/roles.enum';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { InviteStatusEnum } from '../enums/invite-status.enum';
import { Invite } from '../models/invite.model';

export abstract class IInvitesRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract createInvite(
    organizationId: string,
    email: string,
    roles: RolesEnum[],
    invitedBy: string,
    expiresAt: Date,
  ): Promise<Invite>;
  public abstract getInviteById(inviteId: string): Promise<Invite>;
  public abstract getOrganizationInvites(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>>;
  public abstract getPendingInvitesByEmail(
    email: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>>;
  public abstract hasPendingInvite(
    organizationId: string,
    email: string,
  ): Promise<boolean>;
  public abstract updateInviteStatus(
    inviteId: string,
    status: InviteStatusEnum,
  ): Promise<void>;
}
