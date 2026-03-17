import type { JwtPayload } from '../../auth/payloads/jwt.payload';
import { ChangePlanBodyDTO } from '../dtos/change-plan.dto';
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
  ): Promise<UserSubscriptionResponse>;
  public abstract changePlan(
    user: JwtPayload,
    body: ChangePlanBodyDTO,
  ): Promise<CheckoutSessionResponse | UserSubscriptionResponse>;
}
