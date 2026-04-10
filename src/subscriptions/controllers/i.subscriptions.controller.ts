import type { JwtPayload } from '../../auth/models/jwt.model';
import { ChangePlanBodyDTO } from '../dtos/change-plan.dto';
import { CheckoutSessionResponse } from '../models/checkout-session-response.model';
import { SubscriptionPlanResponse } from '../models/subscription-plan-response.model';
import { UserSubscriptionResponse } from '../models/user-subscription-response.model';
import { ISubscriptionsService } from '../services/i.subscriptions.service';

export abstract class ISubscriptionsController {
  protected readonly subscriptionsService: ISubscriptionsService;

  public constructor(subscriptionsService: ISubscriptionsService) {
    this.subscriptionsService = subscriptionsService;
  }

  public abstract getPlans(): Promise<SubscriptionPlanResponse[]>;
  public abstract getMySubscription(
    user: JwtPayload,
  ): Promise<UserSubscriptionResponse | null>;
  public abstract changePlan(
    user: JwtPayload,
    body: ChangePlanBodyDTO,
  ): Promise<CheckoutSessionResponse | UserSubscriptionResponse>;
  public abstract cancelSubscription(user: JwtPayload): Promise<void>;
  public abstract reactivateSubscription(user: JwtPayload): Promise<void>;
}
