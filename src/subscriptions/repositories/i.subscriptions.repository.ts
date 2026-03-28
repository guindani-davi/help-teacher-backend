import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';
import { SubscriptionPlan } from '../models/subscription-plan.model';
import { UserSubscription } from '../models/user-subscription.model';

export abstract class ISubscriptionsRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract getActivePlans(): Promise<SubscriptionPlan[]>;
  public abstract getPlanById(planId: string): Promise<SubscriptionPlan>;
  public abstract getUserSubscription(
    userId: string,
  ): Promise<UserSubscription | null>;
  public abstract getUserTier(
    userId: string,
  ): Promise<SubscriptionTierEnum | null>;
  public abstract getOrganizationOwnerTier(
    organizationId: string,
  ): Promise<SubscriptionTierEnum | null>;
  public abstract createTrialSubscription(
    userId: string,
    planId: string,
  ): Promise<UserSubscription>;
  public abstract updateUserSubscriptionPlan(
    userId: string,
    planId: string,
  ): Promise<UserSubscription>;
  public abstract updateSubscriptionStatus(
    asaasSubscriptionId: string,
    status: SubscriptionStatusEnum,
    canceledAt?: Date,
  ): Promise<UserSubscription | null>;
  public abstract getUserSubscriptionByAsaasId(
    asaasSubscriptionId: string,
  ): Promise<UserSubscription | null>;
  public abstract setPendingPlan(
    userId: string,
    planId: string,
  ): Promise<UserSubscription>;
  public abstract clearPendingPlan(userId: string): Promise<UserSubscription>;
  public abstract applyPendingPlan(
    userId: string,
  ): Promise<UserSubscription | null>;
  public abstract updateAsaasSubscriptionId(
    userId: string,
    asaasSubscriptionId: string,
  ): Promise<UserSubscription>;
  public abstract resetForResubscription(
    userId: string,
    planId: string,
  ): Promise<UserSubscription>;
  public abstract clearAsaasSubscriptionId(
    userId: string,
  ): Promise<UserSubscription>;
  public abstract setCancelAtPeriodEnd(
    userId: string,
    cancel: boolean,
    currentPeriodEnd?: Date,
  ): Promise<UserSubscription>;
}
