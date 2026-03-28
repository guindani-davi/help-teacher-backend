import { Inject, Injectable } from '@nestjs/common';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PostgresErrorCode } from '../../../database/enums/postgres-error-code.enum';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { BillingCycleEnum } from '../../enums/billing-cycle.enum';
import { SubscriptionStatusEnum } from '../../enums/subscription-status.enum';
import { SubscriptionTierEnum } from '../../enums/subscription-tier.enum';
import { SubscriptionPlan } from '../../models/subscription-plan.model';
import { UserSubscription } from '../../models/user-subscription.model';
import { ISubscriptionsRepository } from '../i.subscriptions.repository';

@Injectable()
export class SubscriptionsRepository extends ISubscriptionsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async getActivePlans(): Promise<SubscriptionPlan[]> {
    const result = await this.databaseService
      .from('subscription_plans')
      .select()
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (result.error) {
      throw new DatabaseException();
    }

    return result.data.map((row) => this.mapToPlan(row));
  }

  public async getPlanById(planId: string): Promise<SubscriptionPlan> {
    const result = await this.databaseService
      .from('subscription_plans')
      .select()
      .eq('id', planId)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Subscription plan');
    }

    return this.mapToPlan(result.data);
  }

  public async getUserSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .select()
      .eq('user_id', userId)
      .single();

    if (!result.data) {
      return null;
    }

    return this.mapToEntity(result.data);
  }

  public async getUserTier(
    userId: string,
  ): Promise<SubscriptionTierEnum | null> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .select(
        'plan_id, status, trial_ends_at, subscription_plans!user_subscriptions_plan_id_fkey(tier)',
      )
      .eq('user_id', userId)
      .in('status', [
        SubscriptionStatusEnum.ACTIVE,
        SubscriptionStatusEnum.TRIALING,
      ])
      .single();

    if (!result.data) {
      return null;
    }

    if (
      result.data.status === SubscriptionStatusEnum.TRIALING &&
      result.data.trial_ends_at &&
      new Date() >= new Date(result.data.trial_ends_at)
    ) {
      return null;
    }

    const plan = result.data.subscription_plans as unknown as {
      tier: string;
    } | null;

    if (!plan) {
      return null;
    }

    return plan.tier as SubscriptionTierEnum;
  }

  public async getOrganizationOwnerTier(
    organizationId: string,
  ): Promise<SubscriptionTierEnum | null> {
    const ownerResult = await this.databaseService
      .from('memberships')
      .select('user_id')
      .eq('organization_id', organizationId)
      .contains('roles', ['owner'])
      .eq('is_active', true)
      .single();

    if (!ownerResult.data) {
      return null;
    }

    return this.getUserTier(ownerResult.data.user_id);
  }

  public async updateUserSubscriptionPlan(
    userId: string,
    planId: string,
  ): Promise<UserSubscription> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .update({
        plan_id: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async updateSubscriptionStatus(
    asaasSubscriptionId: string,
    status: SubscriptionStatusEnum,
    canceledAt?: Date,
  ): Promise<UserSubscription | null> {
    const updateData: Database['public']['Tables']['user_subscriptions']['Update'] =
      {
        status,
        updated_at: new Date().toISOString(),
      };

    if (canceledAt) {
      updateData.canceled_at = canceledAt.toISOString();
    }

    const result = await this.databaseService
      .from('user_subscriptions')
      .update(updateData)
      .eq('asaas_subscription_id', asaasSubscriptionId)
      .select()
      .single();

    if (!result.data) {
      return null;
    }

    return this.mapToEntity(result.data);
  }

  public async getUserSubscriptionByAsaasId(
    asaasSubscriptionId: string,
  ): Promise<UserSubscription | null> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .select()
      .eq('asaas_subscription_id', asaasSubscriptionId)
      .single();

    if (!result.data) {
      return null;
    }

    return this.mapToEntity(result.data);
  }

  public async updateAsaasSubscriptionId(
    userId: string,
    asaasSubscriptionId: string,
  ): Promise<UserSubscription> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .update({
        asaas_subscription_id: asaasSubscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async resetForResubscription(
    userId: string,
    planId: string,
  ): Promise<UserSubscription> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .update({
        plan_id: planId,
        asaas_subscription_id: null,
        canceled_at: null,
        cancel_at_period_end: false,
        current_period_end: null,
        pending_plan_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async clearAsaasSubscriptionId(
    userId: string,
  ): Promise<UserSubscription> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .update({
        asaas_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async setCancelAtPeriodEnd(
    userId: string,
    cancel: boolean,
    currentPeriodEnd?: Date,
  ): Promise<UserSubscription> {
    const updateData: Database['public']['Tables']['user_subscriptions']['Update'] =
      {
        cancel_at_period_end: cancel,
        updated_at: new Date().toISOString(),
      };

    if (currentPeriodEnd) {
      updateData.current_period_end = currentPeriodEnd.toISOString();
    }

    const result = await this.databaseService
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  private mapToPlan(
    data: Database['public']['Tables']['subscription_plans']['Row'],
  ): SubscriptionPlan {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new SubscriptionPlan(
      data.id,
      data.name,
      data.tier as SubscriptionTierEnum,
      data.price_cents,
      data.billing_cycle as BillingCycleEnum | null,
      data.asaas_description,
      data.is_active,
      createdAtDate,
      updatedAtDate,
    );
  }

  public async createTrialSubscription(
    userId: string,
    planId: string,
  ): Promise<UserSubscription> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const result = await this.databaseService
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        asaas_subscription_id: null,
        status: SubscriptionStatusEnum.TRIALING,
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select()
      .single();

    if (result.error) {
      if (result.error.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new EntityAlreadyExistsException('Subscription');
      }

      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async setPendingPlan(
    userId: string,
    planId: string,
  ): Promise<UserSubscription> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .update({
        pending_plan_id: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async clearPendingPlan(userId: string): Promise<UserSubscription> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .update({
        pending_plan_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async applyPendingPlan(
    userId: string,
  ): Promise<UserSubscription | null> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || !subscription.pendingPlanId) {
      return null;
    }

    const result = await this.databaseService
      .from('user_subscriptions')
      .update({
        plan_id: subscription.pendingPlanId,
        pending_plan_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  private mapToEntity(
    data: Database['public']['Tables']['user_subscriptions']['Row'],
  ): UserSubscription {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new UserSubscription(
      data.id,
      data.user_id,
      data.plan_id,
      data.asaas_subscription_id,
      data.status as SubscriptionStatusEnum,
      data.pending_plan_id,
      data.trial_ends_at ? new Date(data.trial_ends_at) : null,
      data.current_period_end ? new Date(data.current_period_end) : null,
      data.cancel_at_period_end,
      data.canceled_at ? new Date(data.canceled_at) : null,
      createdAtDate,
      updatedAtDate,
    );
  }
}
