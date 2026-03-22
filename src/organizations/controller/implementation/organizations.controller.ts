import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
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
import { AllowedTiers } from '../../../subscriptions/decorators/allowed-tiers.decorator';
import { SubscriptionTierEnum } from '../../../subscriptions/enums/subscription-tier.enum';
import { SubscriptionTierGuard } from '../../../subscriptions/guards/subscription-tier/subscription-tier.guard';
import { CreateOrganizationBodyDTO } from '../../dtos/create-organization.dto';
import { DeleteMemberParamsDTO } from '../../dtos/delete-member.dto';
import { DeleteOrganizationParamsDTO } from '../../dtos/delete-organization.dto';
import { GetMembersParamsDTO } from '../../dtos/get-members.dto';
import { GetOrganizationBySlugParamsDTO } from '../../dtos/get-organization.dto';
import { TransferOwnershipParamsDTO } from '../../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../../dtos/update-member.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../../dtos/update-organization.dto';
import { Membership } from '../../model/membership.model';
import { Organization } from '../../model/organization.model';
import { IOrganizationsService } from '../../service/i.organizations.service';
import { IOrganizationsController } from '../i.organizations.controller';

@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationsController extends IOrganizationsController {
  public constructor(
    @Inject(IOrganizationsService)
    organizationsService: IOrganizationsService,
  ) {
    super(organizationsService);
  }

  @Post()
  public async createOrganization(
    @Body() body: CreateOrganizationBodyDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<Organization> {
    return this.organizationsService.createOrganization(body, user);
  }

  @Get(':slug/membership')
  @UseGuards(MembershipGuard)
  public async getMembership(
    @CurrentMembership() membership: Membership,
  ): Promise<Membership> {
    return membership;
  }

  @Get(':slug/members')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  public async getMembers(
    @Param() params: GetMembersParamsDTO,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Membership>> {
    return this.organizationsService.getMembers(params, pagination);
  }

  @Put(':slug/members/:memberId')
  @UseGuards(MembershipGuard, RolesGuard, SubscriptionTierGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  @AllowedTiers(SubscriptionTierEnum.PRO)
  public async updateMember(
    @Param() params: UpdateMemberParamsDTO,
    @Body() body: UpdateMemberBodyDTO,
    @CurrentMembership() callerMembership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Membership> {
    return this.organizationsService.updateMember(
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
    return this.organizationsService.transferOwnership(
      params,
      callerMembership,
      user,
    );
  }

  @Get(':slug')
  @UseGuards(MembershipGuard)
  public async getOrganizationBySlug(
    @Param() params: GetOrganizationBySlugParamsDTO,
  ): Promise<Organization> {
    return this.organizationsService.getOrganizationBySlug(params);
  }

  @Patch(':slug')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER)
  public async updateOrganization(
    @Param() params: UpdateOrganizationBySlugParamsDTO,
    @Body() body: UpdateOrganizationBySlugBodyDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<Organization> {
    return this.organizationsService.updateOrganization(params, body, user);
  }

  @Delete(':slug')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteOrganization(
    @Param() params: DeleteOrganizationParamsDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.organizationsService.deleteOrganization(params, user);
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
    await this.organizationsService.deleteMember(
      params,
      callerMembership,
      user,
    );
  }
}
