import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IEmailService } from '../../../email/services/i.email.service';
import { ForbiddenOperationException } from '../../../memberships/exceptions/forbidden-operation.exception';
import type { Membership } from '../../../memberships/models/membership.model';
import { IMembershipsService } from '../../../memberships/services/i.memberships.service';
import { IOrganizationsService } from '../../../organizations/services/i.organizations.service';
import { AcceptInviteParamsDTO } from '../../dtos/accept-invite.dto';
import {
  CreateInviteBodyDTO,
  CreateInviteParamsDTO,
} from '../../dtos/create-invite.dto';
import { GetInviteParamsDTO } from '../../dtos/get-invite.dto';
import { GetOrganizationInvitesParamsDTO } from '../../dtos/get-organization-invites.dto';
import { RejectInviteParamsDTO } from '../../dtos/reject-invite.dto';
import { RevokeInviteParamsDTO } from '../../dtos/revoke-invite.dto';
import { InviteStatusEnum } from '../../enums/invite-status.enum';
import { InviteAlreadyExistsException } from '../../exceptions/invite-already-exists.exception';
import { InviteExpiredException } from '../../exceptions/invite-expired.exception';
import { Invite } from '../../models/invite.model';
import { IInvitesRepository } from '../../repositories/i.invites.repository';
import { IInvitesService } from '../i.invites.service';

@Injectable()
export class InvitesService extends IInvitesService {
  private readonly INVITE_EXPIRY_DAYS = 7;

  public constructor(
    @Inject(IInvitesRepository) invitesRepository: IInvitesRepository,
    @Inject(IOrganizationsService)
    organizationsService: IOrganizationsService,
    @Inject(IMembershipsService)
    membershipsService: IMembershipsService,
    @Inject(IEmailService) emailService: IEmailService,
  ) {
    super(
      invitesRepository,
      organizationsService,
      membershipsService,
      emailService,
    );
  }

  public async createInvite(
    params: CreateInviteParamsDTO,
    body: CreateInviteBodyDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Invite> {
    this.validateInviteRoles(body.roles, callerMembership);

    const organization =
      await this.organizationsService.getOrganizationBySlug(params);

    const hasPending = await this.invitesRepository.hasPendingInvite(
      organization.id,
      body.email,
    );

    if (hasPending) {
      throw new InviteAlreadyExistsException();
    }

    const expiresAt = new Date(
      Date.now() + this.INVITE_EXPIRY_DAYS * 24 * 3600_000,
    );

    const invite = await this.invitesRepository.createInvite(
      organization.id,
      body.email,
      body.roles,
      user.sub,
      expiresAt,
    );

    await this.emailService.sendInviteEmail(
      body.email,
      organization.name,
      user.locale,
    );

    return invite;
  }

  public async getOrganizationInvites(
    params: GetOrganizationInvitesParamsDTO,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>> {
    const organization =
      await this.organizationsService.getOrganizationBySlug(params);

    return this.invitesRepository.getOrganizationInvites(
      organization.id,
      pagination,
    );
  }

  public async getInviteById(
    params: GetInviteParamsDTO,
    user: JwtPayload,
  ): Promise<Invite> {
    const invite = await this.invitesRepository.getInviteById(params.inviteId);

    this.verifyInviteOwnership(invite, user);

    return invite;
  }

  public async acceptInvite(
    params: AcceptInviteParamsDTO,
    user: JwtPayload,
  ): Promise<void> {
    const invite = await this.invitesRepository.getInviteById(params.inviteId);

    this.verifyInviteOwnership(invite, user);
    this.verifyInviteActionable(invite);

    const isAlreadyMember = await this.membershipsService.isUserMember(
      user.sub,
      invite.organizationId,
    );

    if (isAlreadyMember) {
      throw new EntityAlreadyExistsException('Membership');
    }

    await Promise.all([
      this.membershipsService.addMember(
        user.sub,
        invite.organizationId,
        invite.roles,
        invite.invitedBy,
      ),
      this.invitesRepository.updateInviteStatus(
        invite.id,
        InviteStatusEnum.ACCEPTED,
      ),
    ]);
  }

  public async rejectInvite(
    params: RejectInviteParamsDTO,
    user: JwtPayload,
  ): Promise<void> {
    const invite = await this.invitesRepository.getInviteById(params.inviteId);

    this.verifyInviteOwnership(invite, user);
    this.verifyInviteActionable(invite);

    await this.invitesRepository.updateInviteStatus(
      invite.id,
      InviteStatusEnum.REJECTED,
    );
  }

  public async revokeInvite(params: RevokeInviteParamsDTO): Promise<void> {
    const [organization, invite] = await Promise.all([
      this.organizationsService.getOrganizationBySlug(params),
      this.invitesRepository.getInviteById(params.inviteId),
    ]);

    if (invite.organizationId !== organization.id) {
      throw new ForbiddenOperationException(
        'This invite does not belong to this organization',
        'errors.forbiddenOperation',
      );
    }

    if (!invite.isPending()) {
      throw new ForbiddenOperationException(
        'Only pending invites can be revoked',
        'errors.onlyPendingInvitesRevoked',
      );
    }

    await this.invitesRepository.updateInviteStatus(
      invite.id,
      InviteStatusEnum.REVOKED,
    );
  }

  public async getPendingInvites(
    user: JwtPayload,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>> {
    return this.invitesRepository.getPendingInvitesByEmail(
      user.email,
      pagination,
    );
  }

  private validateInviteRoles(
    roles: RolesEnum[],
    callerMembership: Membership,
  ): void {
    if (roles.includes(RolesEnum.OWNER)) {
      throw new ForbiddenOperationException(
        'Cannot invite a user with the owner role',
        'errors.cannotAssignOwnerRole',
      );
    }

    if (
      callerMembership.isAdmin() &&
      !callerMembership.isOwner() &&
      roles.includes(RolesEnum.ADMIN)
    ) {
      throw new ForbiddenOperationException(
        'Admins cannot invite users with the admin role',
        'errors.forbiddenOperation',
      );
    }
  }

  private verifyInviteOwnership(invite: Invite, user: JwtPayload): void {
    if (invite.email !== user.email) {
      throw new ForbiddenOperationException(
        'You do not have access to this invite',
        'errors.inviteEmailMismatch',
      );
    }
  }

  private verifyInviteActionable(invite: Invite): void {
    if (!invite.isPending()) {
      throw new ForbiddenOperationException(
        'This invite is no longer pending',
        'errors.inviteNotPending',
      );
    }

    if (invite.isExpired()) {
      throw new InviteExpiredException();
    }
  }
}
