import type { JwtPayload } from '../../auth/payloads/jwt.payload';
import { ChangePlanBodyDTO } from '../dtos/change-plan.dto';
import { SubscribeBodyDTO } from '../dtos/subscribe.dto';
import { CheckoutSessionResponse } from '../responses/checkout-session.response';
import { SubscriptionPlanResponse } from '../responses/subscription-plan.response';
import { UserSubscriptionResponse } from '../responses/user-subscription.response';
import { ISubscriptionsService } from '../service/i.subscriptions.service';

export abstract class ISubscriptionsController {
  protected readonly subscriptionsService: ISubscriptionsService;

  public constructor(subscriptionsService: ISubscriptionsService) {
    this.subscriptionsService = subscriptionsService;
  }

  public abstract getPlans(): Promise<SubscriptionPlanResponse[]>;
  public abstract getMySubscription(
    user: JwtPayload,
  ): Promise<UserSubscriptionResponse | { tier: 'free' }>;
  public abstract subscribe(
    user: JwtPayload,
    body: SubscribeBodyDTO,
  ): Promise<CheckoutSessionResponse>;
  public abstract changePlan(
    user: JwtPayload,
    body: ChangePlanBodyDTO,
  ): Promise<UserSubscriptionResponse>;
  public abstract cancel(user: JwtPayload): Promise<void>;
}
