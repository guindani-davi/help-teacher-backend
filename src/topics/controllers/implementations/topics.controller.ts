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
import { RolesGuard } from '../../../auth/guards/roles.guard';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { MembershipGuard } from '../../../memberships/guards/membership.guard';
import type { Membership } from '../../../memberships/models/membership.model';
import { ActiveSubscriptionGuard } from '../../../subscriptions/guards/active-subscription.guard';
import { CreateTopicBodyDTO } from '../../dtos/create-topic.dto';
import { DeleteTopicParamsDTO } from '../../dtos/delete-topic.dto';
import { GetTopicParamsDTO } from '../../dtos/get-topic.dto';
import {
  UpdateTopicBodyDTO,
  UpdateTopicParamsDTO,
} from '../../dtos/update-topic.dto';
import { Topic } from '../../models/topic.model';
import { ITopicsService } from '../../services/i.topics.service';
import { ITopicsController } from '../i.topics.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class TopicsController extends ITopicsController {
  public constructor(@Inject(ITopicsService) topicsService: ITopicsService) {
    super(topicsService);
  }

  @Post(':slug/topics')
  public async create(
    @Body() body: CreateTopicBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Topic> {
    return this.topicsService.create(body, membership, user);
  }

  @Get(':slug/topics')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByOrganization(
    @CurrentMembership() membership: Membership,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Topic>> {
    return this.topicsService.getByOrganization(membership, pagination);
  }

  @Get(':slug/topics/:topicId')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getById(
    @Param() params: GetTopicParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<Topic> {
    return this.topicsService.getById(params, membership);
  }

  @Patch(':slug/topics/:topicId')
  public async update(
    @Param() params: UpdateTopicParamsDTO,
    @Body() body: UpdateTopicBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<Topic> {
    return this.topicsService.update(params, body, membership, user);
  }

  @Delete(':slug/topics/:topicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteTopicParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.topicsService.delete(params, membership, user);
  }
}
