import { RolesEnum } from '../../auth/enums/roles.enum';

export class Membership {
  public readonly id: string;
  public readonly userId: string;
  public readonly organizationId: string;
  public readonly roles: RolesEnum[];
  public readonly isActive: boolean;
  public readonly createdBy: string;
  public readonly updatedBy: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    userId: string,
    organizationId: string,
    roles: RolesEnum[],
    isActive: boolean,
    createdBy: string,
    updatedBy: string | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.userId = userId;
    this.organizationId = organizationId;
    this.roles = roles;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public isOwner(): boolean {
    return this.roles.includes(RolesEnum.OWNER);
  }

  public isAdmin(): boolean {
    return this.roles.includes(RolesEnum.ADMIN);
  }
}
