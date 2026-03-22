import { BillingCycleEnum } from '../enums/billing-cycle.enum';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';

export class SubscriptionPlan {
  public readonly id: string;
  public readonly name: string;
  public readonly tier: SubscriptionTierEnum;
  public readonly priceCents: number;
  public readonly billingCycle: BillingCycleEnum | null;
  public readonly asaasDescription: string;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    name: string,
    tier: SubscriptionTierEnum,
    priceCents: number,
    billingCycle: BillingCycleEnum | null,
    asaasDescription: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.name = name;
    this.tier = tier;
    this.priceCents = priceCents;
    this.billingCycle = billingCycle;
    this.asaasDescription = asaasDescription;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public isFree(): boolean {
    return this.tier === SubscriptionTierEnum.FREE;
  }
}
