import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import type { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { IEmailService } from '../../../email/service/i.email.service';
import { ForbiddenOperationException } from '../../../organizations/exceptions/forbidden-operation.exception';
import type { Membership } from '../../../organizations/model/membership.model';
import { IOrganizationsService } from '../../../organizations/service/i.organizations.service';
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
import { Invite } from '../../model/invite.model';
import { IInvitesRepository } from '../../repository/i.invites.repository';
import { IInvitesService } from '../i.invites.service';

@Injectable()
export class InvitesService extends IInvitesService {
  private static readonly INVITE_EXPIRY_DAYS = 7;

  public constructor(
    @Inject(IInvitesRepository) invitesRepository: IInvitesRepository,
    @Inject(IOrganizationsService)
    organizationsService: IOrganizationsService,
    @Inject(IEmailService) emailService: IEmailService,
  ) {
    super(invitesRepository, organizationsService, emailService);
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
      Date.now() + InvitesService.INVITE_EXPIRY_DAYS * 24 * 3600_000,
    );

    const invite = await this.invitesRepository.createInvite(
      organization.id,
      body.email,
      body.roles,
      user.id,
      expiresAt,
    );

    await this.emailService.sendInviteEmail(body.email, organization.name);

    return invite;
  }

  public async getOrganizationInvites(
    params: GetOrganizationInvitesParamsDTO,
  ): Promise<Invite[]> {
    const organization =
      await this.organizationsService.getOrganizationBySlug(params);

    return this.invitesRepository.getOrganizationInvites(organization.id);
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

    const isAlreadyMember = await this.invitesRepository.isAlreadyMember(
      user.id,
      invite.organizationId,
    );

    if (isAlreadyMember) {
      throw new EntityAlreadyExistsException('Membership');
    }

    await this.invitesRepository.createMembership(
      user.id,
      invite.organizationId,
      invite.roles,
      invite.invitedBy,
    );

    await this.invitesRepository.updateInviteStatus(
      invite.id,
      InviteStatusEnum.ACCEPTED,
    );
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
    const organization =
      await this.organizationsService.getOrganizationBySlug(params);

    const invite = await this.invitesRepository.getInviteById(params.inviteId);

    if (invite.organizationId !== organization.id) {
      throw new ForbiddenOperationException(
        'This invite does not belong to this organization',
      );
    }

    if (!invite.isPending()) {
      throw new ForbiddenOperationException(
        'Only pending invites can be revoked',
      );
    }

    await this.invitesRepository.updateInviteStatus(
      invite.id,
      InviteStatusEnum.REVOKED,
    );
  }

  public async getPendingInvites(user: JwtPayload): Promise<Invite[]> {
    return this.invitesRepository.getPendingInvitesByEmail(user.email);
  }

  private validateInviteRoles(
    roles: RolesEnum[],
    callerMembership: Membership,
  ): void {
    if (roles.includes(RolesEnum.OWNER)) {
      throw new ForbiddenOperationException(
        'Cannot invite a user with the owner role',
      );
    }

    if (
      callerMembership.isAdmin() &&
      !callerMembership.isOwner() &&
      roles.includes(RolesEnum.ADMIN)
    ) {
      throw new ForbiddenOperationException(
        'Admins cannot invite users with the admin role',
      );
    }
  }

  private verifyInviteOwnership(invite: Invite, user: JwtPayload): void {
    if (invite.email !== user.email) {
      throw new ForbiddenOperationException(
        'You do not have access to this invite',
      );
    }
  }

  private verifyInviteActionable(invite: Invite): void {
    if (!invite.isPending()) {
      throw new ForbiddenOperationException('This invite is no longer pending');
    }

    if (invite.isExpired()) {
      throw new InviteExpiredException();
    }
  }
}
