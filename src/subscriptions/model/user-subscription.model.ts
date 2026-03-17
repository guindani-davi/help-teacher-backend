import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';

export class UserSubscription {
  public readonly id: string;
  public readonly userId: string;
  public readonly planId: string;
  public readonly asaasSubscriptionId: string | null;
  public readonly status: SubscriptionStatusEnum;
  public readonly pendingPlanId: string | null;
  public readonly currentPeriodEnd: Date | null;
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
    currentPeriodEnd: Date | null,
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
    this.currentPeriodEnd = currentPeriodEnd;
    this.canceledAt = canceledAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public isActive(): boolean {
    return this.status === SubscriptionStatusEnum.ACTIVE;
  }
}
