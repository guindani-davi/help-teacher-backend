import { RolesEnum } from '../../auth/enums/roles.enum';
import { IDatabaseService } from '../../database/service/i.database.service';
import { Database } from '../../database/types';
import { IHelpersService } from '../../helpers/service/i.helpers.service';
import { InviteStatusEnum } from '../enums/invite-status.enum';
import { Invite } from '../model/invite.model';

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
  ): Promise<Invite[]>;
  public abstract getPendingInvitesByEmail(email: string): Promise<Invite[]>;
  public abstract hasPendingInvite(
    organizationId: string,
    email: string,
  ): Promise<boolean>;
  public abstract updateInviteStatus(
    inviteId: string,
    status: InviteStatusEnum,
  ): Promise<void>;
  public abstract isAlreadyMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean>;
  public abstract createMembership(
    userId: string,
    organizationId: string,
    roles: RolesEnum[],
    createdBy: string,
  ): Promise<void>;
  protected abstract mapToEntity(
    data: Database['public']['Tables']['invites']['Row'],
  ): Invite;
}
