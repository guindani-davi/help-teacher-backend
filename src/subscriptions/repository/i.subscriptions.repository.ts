import { IDatabaseService } from '../../database/service/i.database.service';
import { Database } from '../../database/types';
import { IHelpersService } from '../../helpers/service/i.helpers.service';
import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';
import { SubscriptionPlan } from '../model/subscription-plan.model';
import { UserSubscription } from '../model/user-subscription.model';

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
  public abstract getFreePlan(): Promise<SubscriptionPlan>;
  public abstract getUserSubscription(
    userId: string,
  ): Promise<UserSubscription | null>;
  public abstract getUserTier(userId: string): Promise<SubscriptionTierEnum>;
  public abstract getOrganizationOwnerTier(
    organizationId: string,
  ): Promise<SubscriptionTierEnum>;
  public abstract createUserSubscription(
    userId: string,
    planId: string,
    asaasSubscriptionId: string | null,
  ): Promise<UserSubscription>;
  public abstract createFreeSubscription(
    userId: string,
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
  protected abstract mapToPlan(
    data: Database['public']['Tables']['subscription_plans']['Row'],
  ): SubscriptionPlan;
  protected abstract mapToSubscription(
    data: Database['public']['Tables']['user_subscriptions']['Row'],
  ): UserSubscription;
}
