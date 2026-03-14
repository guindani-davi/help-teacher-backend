import { RolesEnum } from '../../auth/enums/roles.enum';
import { InviteStatusEnum } from '../enums/invite-status.enum';

export class Invite {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly email: string;
  public readonly roles: RolesEnum[];
  public readonly status: InviteStatusEnum;
  public readonly invitedBy: string;
  public readonly expiresAt: Date;
  public readonly respondedAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    organizationId: string,
    email: string,
    roles: RolesEnum[],
    status: InviteStatusEnum,
    invitedBy: string,
    expiresAt: Date,
    respondedAt: Date | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.organizationId = organizationId;
    this.email = email;
    this.roles = roles;
    this.status = status;
    this.invitedBy = invitedBy;
    this.expiresAt = expiresAt;
    this.respondedAt = respondedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public isPending(): boolean {
    return this.status === InviteStatusEnum.PENDING;
  }

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}
