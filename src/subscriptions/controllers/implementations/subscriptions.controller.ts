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
import { SubscriptionInvalidStateException } from '../../exceptions/subscription-invalid-state.exception';
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
    const plans = await this.subscriptionsService.getPlans();
    return plans.map((plan) => new SubscriptionPlanResponse(plan));
  }

  @Get('me')
  public async getMySubscription(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserSubscriptionResponse | null> {
    const result = await this.subscriptionsService.getMySubscription(user.sub);

    if (!result) {
      return null;
    }

    return new UserSubscriptionResponse(
      result.subscription,
      result.plan,
      result.pendingPlan,
    );
  }

  @Put('change-plan')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  public async changePlan(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChangePlanBodyDTO,
  ): Promise<CheckoutSessionResponse | UserSubscriptionResponse> {
    const result = await this.subscriptionsService.changePlan(
      user.sub,
      body.planId,
    );

    if (result instanceof CheckoutSessionResponse) {
      return result;
    }

    const subscriptionData = await this.subscriptionsService.getMySubscription(
      user.sub,
    );

    if (!subscriptionData) {
      throw new SubscriptionInvalidStateException();
    }

    return new UserSubscriptionResponse(
      result,
      subscriptionData.plan,
      subscriptionData.pendingPlan,
    );
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
