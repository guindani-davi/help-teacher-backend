import { Inject, Injectable } from '@nestjs/common';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PostgresErrorCode } from '../../../database/enums/postgres-error-code.enum';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/service/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/service/i.helpers.service';
import { BillingCycleEnum } from '../../enums/billing-cycle.enum';
import { SubscriptionStatusEnum } from '../../enums/subscription-status.enum';
import { SubscriptionTierEnum } from '../../enums/subscription-tier.enum';
import { SubscriptionPlan } from '../../model/subscription-plan.model';
import { UserSubscription } from '../../model/user-subscription.model';
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
      throw new EntityNotFoundException('SubscriptionPlan');
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

    return this.mapToSubscription(result.data);
  }

  public async getUserTier(userId: string): Promise<SubscriptionTierEnum> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .select('plan_id, subscription_plans(tier)')
      .eq('user_id', userId)
      .eq('status', SubscriptionStatusEnum.ACTIVE)
      .single();

    if (!result.data) {
      return SubscriptionTierEnum.FREE;
    }

    const plans = result.data.subscription_plans as unknown as {
      tier: string;
    } | null;

    if (!plans) {
      return SubscriptionTierEnum.FREE;
    }

    return plans.tier as SubscriptionTierEnum;
  }

  public async createUserSubscription(
    userId: string,
    planId: string,
    asaasSubscriptionId: string,
  ): Promise<UserSubscription> {
    const result = await this.databaseService
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        asaas_subscription_id: asaasSubscriptionId,
        status: SubscriptionStatusEnum.ACTIVE,
      })
      .select()
      .single();

    if (result.error) {
      if (result.error.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new EntityAlreadyExistsException('UserSubscription');
      }

      throw new DatabaseException();
    }

    return this.mapToSubscription(result.data);
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

    return this.mapToSubscription(result.data);
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

    return this.mapToSubscription(result.data);
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

    return this.mapToSubscription(result.data);
  }

  protected mapToPlan(
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

  protected mapToSubscription(
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
      data.current_period_end ? new Date(data.current_period_end) : null,
      data.canceled_at ? new Date(data.canceled_at) : null,
      createdAtDate,
      updatedAtDate,
    );
  }
}
