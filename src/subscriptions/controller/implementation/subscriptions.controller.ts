import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AuthGuard } from '../../../auth/guards/jwt/jwt.guard';
import type { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { ChangePlanBodyDTO } from '../../dtos/change-plan.dto';
import { CheckoutSessionResponse } from '../../responses/checkout-session.response';
import { SubscriptionPlanResponse } from '../../responses/subscription-plan.response';
import { UserSubscriptionResponse } from '../../responses/user-subscription.response';
import { ISubscriptionsService } from '../../service/i.subscriptions.service';
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
  public async getPlans(): Promise<SubscriptionPlanResponse[]> {
    const plans = await this.subscriptionsService.getPlans();
    return plans.map((plan) => new SubscriptionPlanResponse(plan));
  }

  @Get('me')
  @UseGuards(AuthGuard)
  public async getMySubscription(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserSubscriptionResponse> {
    const { subscription, plan, pendingPlan } =
      await this.subscriptionsService.getMySubscription(user.sub);

    return new UserSubscriptionResponse(subscription, plan, pendingPlan);
  }

  @Put('change-plan')
  @UseGuards(AuthGuard)
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

    const { plan, pendingPlan } =
      await this.subscriptionsService.getMySubscription(user.sub);

    return new UserSubscriptionResponse(result, plan, pendingPlan);
  }
}
