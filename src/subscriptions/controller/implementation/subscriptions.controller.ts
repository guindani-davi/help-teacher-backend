import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AuthGuard } from '../../../auth/guards/jwt/jwt.guard';
import type { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { ChangePlanBodyDTO } from '../../dtos/change-plan.dto';
import { SubscribeBodyDTO } from '../../dtos/subscribe.dto';
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
  ): Promise<UserSubscriptionResponse | { tier: 'free' }> {
    const { subscription, plan } =
      await this.subscriptionsService.getMySubscription(user.sub);

    if (!subscription || !plan) {
      return { tier: 'free' };
    }

    return new UserSubscriptionResponse(subscription, plan);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  public async subscribe(
    @CurrentUser() user: JwtPayload,
    @Body() body: SubscribeBodyDTO,
  ): Promise<CheckoutSessionResponse> {
    return this.subscriptionsService.subscribe(
      user.sub,
      body.planId,
      user.email,
      user.email,
    );
  }

  @Put('change-plan')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  public async changePlan(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChangePlanBodyDTO,
  ): Promise<UserSubscriptionResponse> {
    const updatedSubscription = await this.subscriptionsService.changePlan(
      user.sub,
      body.planId,
    );

    const { plan } = await this.subscriptionsService.getMySubscription(
      user.sub,
    );

    return new UserSubscriptionResponse(updatedSubscription, plan!);
  }

  @Post('cancel')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  public async cancel(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.subscriptionsService.cancel(user.sub);
  }
}
