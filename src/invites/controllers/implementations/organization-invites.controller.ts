import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentMembership } from '../../../auth/decorators/current-membership.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AllowedRoles } from '../../../auth/decorators/roles.decorator';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { MembershipGuard } from '../../../auth/guards/membership.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import type { Membership } from '../../../memberships/models/membership.model';
import { AllowedTiers } from '../../../subscriptions/decorators/allowed-tiers.decorator';
import { SubscriptionTierEnum } from '../../../subscriptions/enums/subscription-tier.enum';
import { SubscriptionTierGuard } from '../../../subscriptions/guards/subscription-tier.guard';
import {
  CreateInviteBodyDTO,
  CreateInviteParamsDTO,
} from '../../dtos/create-invite.dto';
import { GetOrganizationInvitesParamsDTO } from '../../dtos/get-organization-invites.dto';
import { RevokeInviteParamsDTO } from '../../dtos/revoke-invite.dto';
import { Invite } from '../../models/invite.model';
import { IInvitesService } from '../../services/i.invites.service';
import { IOrganizationInvitesController } from '../i.organization-invites.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, SubscriptionTierGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
@AllowedTiers(SubscriptionTierEnum.PRO)
export class OrganizationInvitesController extends IOrganizationInvitesController {
  public constructor(@Inject(IInvitesService) invitesService: IInvitesService) {
    super(invitesService);
  }

  @Post(':slug/invites')
  public async createInvite(
    @Param() params: CreateInviteParamsDTO,
    @Body() body: CreateInviteBodyDTO,
    @CurrentMembership() callerMembership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Invite> {
    return this.invitesService.createInvite(
      params,
      body,
      callerMembership,
      user,
    );
  }

  @Get(':slug/invites')
  public async getOrganizationInvites(
    @Param() params: GetOrganizationInvitesParamsDTO,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>> {
    return this.invitesService.getOrganizationInvites(params, pagination);
  }

  @Delete(':slug/invites/:inviteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async revokeInvite(
    @Param() params: RevokeInviteParamsDTO,
  ): Promise<void> {
    await this.invitesService.revokeInvite(params);
  }
}
