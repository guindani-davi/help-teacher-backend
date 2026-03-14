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
import { AuthGuard } from '../../../auth/guards/jwt/jwt.guard';
import { MembershipGuard } from '../../../auth/guards/membership/membership.guard';
import { RolesGuard } from '../../../auth/guards/roles/roles.guard';
import type { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/responses/paginated.response';
import type { Membership } from '../../../organizations/model/membership.model';
import {
  CreateInviteBodyDTO,
  CreateInviteParamsDTO,
} from '../../dtos/create-invite.dto';
import { GetOrganizationInvitesParamsDTO } from '../../dtos/get-organization-invites.dto';
import { RevokeInviteParamsDTO } from '../../dtos/revoke-invite.dto';
import { Invite } from '../../model/invite.model';
import { IInvitesService } from '../../service/i.invites.service';
import { IOrganizationInvitesController } from '../i.organization-invites.controller';

@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationInvitesController extends IOrganizationInvitesController {
  public constructor(@Inject(IInvitesService) invitesService: IInvitesService) {
    super(invitesService);
  }

  @Post(':slug/invites')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
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
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  public async getOrganizationInvites(
    @Param() params: GetOrganizationInvitesParamsDTO,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>> {
    return this.invitesService.getOrganizationInvites(params, pagination);
  }

  @Delete(':slug/invites/:inviteId')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async revokeInvite(
    @Param() params: RevokeInviteParamsDTO,
  ): Promise<void> {
    await this.invitesService.revokeInvite(params);
  }
}
