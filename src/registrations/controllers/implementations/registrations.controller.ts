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
import { ActiveSubscriptionGuard } from '../../../subscriptions/guards/active-subscription.guard';
import { CreateRegistrationBodyDTO } from '../../dtos/create-registration.dto';
import { DeleteRegistrationParamsDTO } from '../../dtos/delete-registration.dto';
import { GetRegistrationParamsDTO } from '../../dtos/get-registration.dto';
import {
  UpdateRegistrationBodyDTO,
  UpdateRegistrationParamsDTO,
} from '../../dtos/update-registration.dto';
import { Registration } from '../../models/registration.model';
import { IRegistrationsService } from '../../services/i.registrations.service';
import { IRegistrationsController } from '../i.registrations.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class RegistrationsController extends IRegistrationsController {
  public constructor(
    @Inject(IRegistrationsService)
    registrationsService: IRegistrationsService,
  ) {
    super(registrationsService);
  }

  @Post(':slug/registrations')
  public async create(
    @Body() body: CreateRegistrationBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Registration> {
    return this.registrationsService.create(body, membership, user);
  }

  @Get(':slug/registrations')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Registration>> {
    return this.registrationsService.getByOrganization(membership, pagination);
  }

  @Get(':slug/registrations/:registrationId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetRegistrationParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<Registration> {
    return this.registrationsService.getById(params, membership);
  }

  @Patch(':slug/registrations/:registrationId')
  public async update(
    @Param() params: UpdateRegistrationParamsDTO,
    @Body() body: UpdateRegistrationBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Registration> {
    return this.registrationsService.update(params, body, membership, user);
  }

  @Delete(':slug/registrations/:registrationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteRegistrationParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.registrationsService.delete(params, membership, user);
  }
}
