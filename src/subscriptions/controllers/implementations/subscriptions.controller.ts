import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { ChangePlanBodyDTO } from '../../dtos/change-plan.dto';
import { CheckoutSessionResponse } from '../../models/checkout-session-response.model';
import { SubscriptionPlanResponse } from '../../models/subscription-plan-response.model';
import { UserSubscriptionResponse } from '../../models/user-subscription-response.model';
import { ISubscriptionsService } from '../../services/i.subscriptions.service';
import { ISubscriptionsController } from '../i.subscriptions.controller';

@Controller('subscriptions')
export class SubscriptionsController extends ISubscriptionsController {
  public constructor(
    @Inject(ISubscriptionsService)
    subscriptionsService: ISubscriptionsService,
  ) {
    super(subscriptionsService);
  }

  @Get('plans')
  @Public()
  public async getPlans(): Promise<SubscriptionPlanResponse[]> {
    return this.subscriptionsService.getPlansResponse();
  }

  @Get('me')
  public async getMySubscription(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserSubscriptionResponse | null> {
    return this.subscriptionsService.getMySubscriptionResponse(user.sub);
  }

  @Put('change-plan')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  public async changePlan(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChangePlanBodyDTO,
  ): Promise<CheckoutSessionResponse | UserSubscriptionResponse> {
    return this.subscriptionsService.changePlanResponse(user.sub, body.planId);
  }

  @Post('cancel')
  @HttpCode(204)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  public async cancelSubscription(
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.subscriptionsService.cancelSubscription(user.sub);
  }

  @Post('reactivate')
  @HttpCode(204)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  public async reactivateSubscription(
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.subscriptionsService.reactivateSubscription(user.sub);
  }
}
