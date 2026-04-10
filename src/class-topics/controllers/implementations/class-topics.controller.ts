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
  UseGuards,
} from '@nestjs/common';
import { CurrentMembership } from '../../../auth/decorators/current-membership.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AllowedRoles } from '../../../auth/decorators/roles.decorator';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { MembershipGuard } from '../../../memberships/guards/membership.guard';
import type { Membership } from '../../../memberships/models/membership.model';
import { ActiveSubscriptionGuard } from '../../../subscriptions/guards/active-subscription.guard';
import { CreateClassTopicBodyDTO } from '../../dtos/create-class-topic.dto';
import { DeleteClassTopicParamsDTO } from '../../dtos/delete-class-topic.dto';
import { GetClassTopicsParamsDTO } from '../../dtos/get-class-topics.dto';
import { ClassTopicDetail } from '../../models/class-topic-detail.model';
import { ClassTopic } from '../../models/class-topic.model';
import { IClassTopicsService } from '../../services/i.class-topics.service';
import { IClassTopicsController } from '../i.class-topics.controller';

@Controller('organizations')
@UseGuards(MembershipGuard, RolesGuard, ActiveSubscriptionGuard)
@AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
export class ClassTopicsController extends IClassTopicsController {
  public constructor(
    @Inject(IClassTopicsService) classTopicsService: IClassTopicsService,
  ) {
    super(classTopicsService);
  }

  @Get(':slug/classes/:classId/topics')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async getByClassId(
    @Param() params: GetClassTopicsParamsDTO,
    @CurrentMembership() membership: Membership,
  ): Promise<ClassTopicDetail[]> {
    return this.classTopicsService.getByClassId(params.classId, membership);
  }

  @Post(':slug/classes/:classId/topics')
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN, RolesEnum.TEACHER)
  public async create(
    @Param('classId') classId: string,
    @Body() body: CreateClassTopicBodyDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<ClassTopic> {
    return this.classTopicsService.create(classId, body, membership, user);
  }

  @Delete(':slug/classes/:classId/topics/:classTopicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param() params: DeleteClassTopicParamsDTO,
    @CurrentMembership() membership: Membership,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.classTopicsService.delete(params, membership, user);
  }
}
