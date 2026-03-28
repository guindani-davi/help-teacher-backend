import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';
import { SubscriptionPlanResponse } from './subscription-plan-response.model';
import { SubscriptionPlan } from './subscription-plan.model';
import { UserSubscription } from './user-subscription.model';

export class UserSubscriptionResponse {
  public readonly plan: SubscriptionPlanResponse;
  public readonly status: SubscriptionStatusEnum;
  public readonly pendingPlan: SubscriptionPlanResponse | null;
  public readonly trialEndsAt: string | null;
  public readonly currentPeriodEnd: string | null;
  public readonly cancelAtPeriodEnd: boolean;
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
    this.trialEndsAt = subscription.trialEndsAt
      ? subscription.trialEndsAt.toISOString()
      : null;
    this.currentPeriodEnd = subscription.currentPeriodEnd
      ? subscription.currentPeriodEnd.toISOString()
      : null;
    this.cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;
    this.canceledAt = subscription.canceledAt
      ? subscription.canceledAt.toISOString()
      : null;
  }
}
