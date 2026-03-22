import { BillingCycleEnum } from '../enums/billing-cycle.enum';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';
import { SubscriptionPlan } from '../model/subscription-plan.model';

export class SubscriptionPlanResponse {
  public readonly id: string;
  public readonly name: string;
  public readonly tier: SubscriptionTierEnum;
  public readonly priceCents: number;
  public readonly billingCycle: BillingCycleEnum | null;

  public constructor(plan: SubscriptionPlan) {
    this.id = plan.id;
    this.name = plan.name;
    this.tier = plan.tier;
    this.priceCents = plan.priceCents;
    this.billingCycle = plan.billingCycle;
  }
}
