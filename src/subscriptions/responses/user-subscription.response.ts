import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';
import { SubscriptionPlan } from '../model/subscription-plan.model';
import { UserSubscription } from '../model/user-subscription.model';
import { SubscriptionPlanResponse } from './subscription-plan.response';

export class UserSubscriptionResponse {
  public readonly plan: SubscriptionPlanResponse;
  public readonly status: SubscriptionStatusEnum;
  public readonly pendingPlan: SubscriptionPlanResponse | null;
  public readonly currentPeriodEnd: string | null;
  public readonly canceledAt: string | null;

  public constructor(
    subscription: UserSubscription,
    plan: SubscriptionPlan,
    pendingPlan: SubscriptionPlan | null,
  ) {
    this.plan = new SubscriptionPlanResponse(plan);
    this.status = subscription.status;
    this.pendingPlan = pendingPlan
      ? new SubscriptionPlanResponse(pendingPlan)
      : null;
    this.currentPeriodEnd = subscription.currentPeriodEnd
      ? subscription.currentPeriodEnd.toISOString()
      : null;
    this.canceledAt = subscription.canceledAt
      ? subscription.canceledAt.toISOString()
      : null;
  }
}
