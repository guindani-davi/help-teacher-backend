import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/payloads/jwt.payload';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import { IEmailService } from '../../email/service/i.email.service';
import type { Membership } from '../../organizations/model/membership.model';
import { IOrganizationsService } from '../../organizations/service/i.organizations.service';
import { AcceptInviteParamsDTO } from '../dtos/accept-invite.dto';
import {
  CreateInviteBodyDTO,
  CreateInviteParamsDTO,
} from '../dtos/create-invite.dto';
import { GetInviteParamsDTO } from '../dtos/get-invite.dto';
import { GetOrganizationInvitesParamsDTO } from '../dtos/get-organization-invites.dto';
import { RejectInviteParamsDTO } from '../dtos/reject-invite.dto';
import { RevokeInviteParamsDTO } from '../dtos/revoke-invite.dto';
import { Invite } from '../model/invite.model';
import { IInvitesRepository } from '../repository/i.invites.repository';

@Injectable()
export abstract class IInvitesService {
  protected readonly invitesRepository: IInvitesRepository;
  protected readonly organizationsService: IOrganizationsService;
  protected readonly emailService: IEmailService;

  public constructor(
    invitesRepository: IInvitesRepository,
    organizationsService: IOrganizationsService,
    emailService: IEmailService,
  ) {
    this.invitesRepository = invitesRepository;
    this.organizationsService = organizationsService;
    this.emailService = emailService;
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
  public abstract revokeInvite(params: RevokeInviteParamsDTO): Promise<void>;
  public abstract getPendingInvites(
    user: JwtPayload,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>>;
}
