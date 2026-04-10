import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentMembership } from '../../../auth/decorators/current-membership.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AllowedRoles } from '../../../auth/decorators/roles.decorator';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { AllowedTiers } from '../../../subscriptions/decorators/allowed-tiers.decorator';
import { SubscriptionTierEnum } from '../../../subscriptions/enums/subscription-tier.enum';
import { ActiveSubscriptionGuard } from '../../../subscriptions/guards/active-subscription.guard';
import { SubscriptionTierGuard } from '../../../subscriptions/guards/subscription-tier.guard';
import { DeleteMemberParamsDTO } from '../../dtos/delete-member.dto';
import { GetMembersParamsDTO } from '../../dtos/get-members.dto';
import { TransferOwnershipParamsDTO } from '../../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../../dtos/update-member.dto';
import { MembershipGuard } from '../../guards/membership.guard';
import { Membership } from '../../models/membership.model';
import { IMembershipsService } from '../../services/i.memberships.service';
import { IMembershipsController } from '../i.memberships.controller';

@Controller('memberships')
@UseGuards(MembershipGuard, ActiveSubscriptionGuard)
export class MembershipsController extends IMembershipsController {
  public constructor(
    @Inject(IMembershipsService)
    membershipsService: IMembershipsService,
  ) {
    super(membershipsService);
  }

  @Get(':slug')
  public async getMembership(
    @CurrentMembership() membership: Membership,
  ): Promise<Membership> {
    return membership;
  }

  @Get(':slug/members')
  @UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  public async getMembers(
    @Param() params: GetMembersParamsDTO,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Membership>> {
    return this.membershipsService.getMembers(params, pagination);
  }

  @Put(':slug/members/:memberId')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  public async updateMember(
    @Param() params: UpdateMemberParamsDTO,
    @Body() body: UpdateMemberBodyDTO,
    @CurrentMembership() callerMembership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Membership> {
    return this.membershipsService.updateMember(
      params,
      body,
      callerMembership,
      user,
    );
  }

  @Put(':slug/transfer-ownership/:memberId')
  @UseGuards(MembershipGuard, RolesGuard, SubscriptionTierGuard)
  @AllowedRoles(RolesEnum.OWNER)
  @AllowedTiers(SubscriptionTierEnum.PRO)
  @HttpCode(HttpStatus.OK)
  public async transferOwnership(
    @Param() params: TransferOwnershipParamsDTO,
    @CurrentMembership() callerMembership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Membership> {
    return this.membershipsService.transferOwnership(
      params,
      callerMembership,
      user,
    );
  }

  @Delete(':slug/members/:memberId')
  @UseGuards(MembershipGuard, RolesGuard, SubscriptionTierGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  @AllowedTiers(SubscriptionTierEnum.PRO)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteMember(
    @Param() params: DeleteMemberParamsDTO,
    @CurrentMembership() callerMembership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.membershipsService.deleteMember(params, callerMembership, user);
  }
}
