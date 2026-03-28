import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';

export class UserSubscription {
  public readonly id: string;
  public readonly userId: string;
  public readonly planId: string;
  public readonly asaasSubscriptionId: string | null;
  public readonly status: SubscriptionStatusEnum;
  public readonly pendingPlanId: string | null;
  public readonly trialEndsAt: Date | null;
  public readonly currentPeriodEnd: Date | null;
  public readonly cancelAtPeriodEnd: boolean;
  public readonly canceledAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date | null;

  public constructor(
    id: string,
    userId: string,
    planId: string,
    asaasSubscriptionId: string | null,
    status: SubscriptionStatusEnum,
    pendingPlanId: string | null,
    trialEndsAt: Date | null,
    currentPeriodEnd: Date | null,
    cancelAtPeriodEnd: boolean,
    canceledAt: Date | null,
    createdAt: Date,
    updatedAt: Date | null,
  ) {
    this.id = id;
    this.userId = userId;
    this.planId = planId;
    this.asaasSubscriptionId = asaasSubscriptionId;
    this.status = status;
    this.pendingPlanId = pendingPlanId;
    this.trialEndsAt = trialEndsAt;
    this.currentPeriodEnd = currentPeriodEnd;
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.canceledAt = canceledAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public isActive(): boolean {
    return this.status === SubscriptionStatusEnum.ACTIVE;
  }

  public isTrialing(): boolean {
    return this.status === SubscriptionStatusEnum.TRIALING;
  }

  public isTrialExpired(): boolean {
    if (!this.isTrialing() || !this.trialEndsAt) {
      return false;
    }

    return new Date() >= this.trialEndsAt;
  }

  public hasValidAccess(): boolean {
    if (this.isActive()) {
      return true;
    }

    if (this.isTrialing() && !this.isTrialExpired()) {
      return true;
    }

    return false;
  }
}
