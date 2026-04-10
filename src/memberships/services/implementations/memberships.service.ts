import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IOrganizationsService } from '../../../organizations/services/i.organizations.service';
import { DeleteMemberParamsDTO } from '../../dtos/delete-member.dto';
import { GetMembersParamsDTO } from '../../dtos/get-members.dto';
import { GetMembershipParamsDTO } from '../../dtos/get-membership.dto';
import { TransferOwnershipParamsDTO } from '../../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../../dtos/update-member.dto';
import { ForbiddenOperationException } from '../../exceptions/forbidden-operation.exception';
import { Membership } from '../../models/membership.model';
import { IMembershipsRepository } from '../../repositories/i.memberships.repository';
import { IMembershipsService } from '../i.memberships.service';

@Injectable()
export class MembershipsService extends IMembershipsService {
  public constructor(
    @Inject(IMembershipsRepository)
    membershipsRepository: IMembershipsRepository,
    @Inject(IOrganizationsService)
    organizationsService: IOrganizationsService,
  ) {
    super(membershipsRepository, organizationsService);
  }

  public async getMembership(
    params: GetMembershipParamsDTO,
    user: JwtPayload,
  ): Promise<Membership> {
    const organization =
      await this.organizationsService.getOrganizationBySlug(params);

    return this.membershipsRepository.getMembership(organization.id, user);
  }

  public async getMembershipBySlug(
    slug: string,
    user: JwtPayload,
  ): Promise<Membership> {
    return this.membershipsRepository.getMembershipBySlug(slug, user.sub);
  }

  public async getMembers(
    params: GetMembersParamsDTO,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Membership>> {
    const organization =
      await this.organizationsService.getOrganizationBySlug(params);

    return this.membershipsRepository.getMembers(organization.id, pagination);
  }

  public async updateMember(
    params: UpdateMemberParamsDTO,
    body: UpdateMemberBodyDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership> {
    const targetMembership = await this.membershipsRepository.getMembershipById(
      params.memberId,
    );

    if (targetMembership.organizationId !== callerMembership.organizationId) {
      throw new ForbiddenOperationException(
        'Member does not belong to this organization',
        'errors.memberNotInOrganization',
      );
    }

    if (body.roles) {
      this.validateOwnerRoleIntegrity(body.roles, targetMembership);
    }

    if (
      targetMembership.isOwner() &&
      targetMembership.id !== callerMembership.id
    ) {
      throw new ForbiddenOperationException(
        'You do not have permission to update this member',
        'errors.cannotUpdateOwner',
      );
    }

    if (
      callerMembership.isAdmin() &&
      !callerMembership.isOwner() &&
      targetMembership.isAdmin()
    ) {
      throw new ForbiddenOperationException(
        'You do not have permission to update this member',
        'errors.cannotUpdateAdmin',
      );
    }

    return this.membershipsRepository.updateMember(params, body, user);
  }

  public async deleteMember(
    params: DeleteMemberParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    const targetMembership = await this.membershipsRepository.getMembershipById(
      params.memberId,
    );

    if (targetMembership.organizationId !== callerMembership.organizationId) {
      throw new ForbiddenOperationException(
        'Member does not belong to this organization',
        'errors.memberNotInOrganization',
      );
    }

    if (targetMembership.isOwner()) {
      throw new ForbiddenOperationException(
        'You do not have permission to remove this member',
        'errors.cannotRemoveOwner',
      );
    }

    if (
      callerMembership.isAdmin() &&
      !callerMembership.isOwner() &&
      targetMembership.isAdmin()
    ) {
      throw new ForbiddenOperationException(
        'You do not have permission to remove this member',
        'errors.cannotRemoveAdmin',
      );
    }

    await this.membershipsRepository.deleteMember(params, user);
  }

  public async transferOwnership(
    params: TransferOwnershipParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership> {
    const targetMembership = await this.membershipsRepository.getMembershipById(
      params.memberId,
    );

    if (targetMembership.organizationId !== callerMembership.organizationId) {
      throw new ForbiddenOperationException(
        'Member does not belong to this organization',
        'errors.memberNotInOrganization',
      );
    }

    if (targetMembership.isOwner()) {
      throw new ForbiddenOperationException(
        'Target member is already the owner',
        'errors.targetAlreadyOwner',
      );
    }

    return this.membershipsRepository.transferOwnership(
      params,
      callerMembership,
      user,
    );
  }

  public async isUserMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    return this.membershipsRepository.isUserMember(userId, organizationId);
  }

  public async addMember(
    userId: string,
    organizationId: string,
    roles: RolesEnum[],
    createdBy: string,
  ): Promise<void> {
    await this.membershipsRepository.createMembership(
      userId,
      organizationId,
      roles,
      createdBy,
    );
  }

  public async addRoleToMember(
    userId: string,
    organizationId: string,
    role: RolesEnum,
    updatedBy: string,
  ): Promise<void> {
    await this.membershipsRepository.addRoleToMember(
      userId,
      organizationId,
      role,
      updatedBy,
    );
  }

  public async removeRoleFromMember(
    userId: string,
    organizationId: string,
    role: RolesEnum,
    updatedBy: string,
  ): Promise<void> {
    await this.membershipsRepository.removeRoleFromMember(
      userId,
      organizationId,
      role,
      updatedBy,
    );
  }

  public async hasRole(
    userId: string,
    organizationId: string,
    role: RolesEnum,
  ): Promise<boolean> {
    return this.membershipsRepository.hasRole(userId, organizationId, role);
  }

  private validateOwnerRoleIntegrity(
    newRoles: RolesEnum[],
    targetMembership: Membership,
  ): void {
    const includesOwner = newRoles.includes(RolesEnum.OWNER);
    const isCurrentlyOwner = targetMembership.isOwner();

    if (includesOwner && !isCurrentlyOwner) {
      throw new ForbiddenOperationException(
        'Cannot assign owner role directly, use transfer ownership',
        'errors.cannotAssignOwnerRole',
      );
    }

    if (!includesOwner && isCurrentlyOwner) {
      throw new ForbiddenOperationException(
        'Cannot remove owner role directly, use transfer ownership',
        'errors.cannotRemoveOwnerRole',
      );
    }
  }
}
