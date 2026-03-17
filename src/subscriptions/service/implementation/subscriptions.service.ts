import { Inject, Injectable } from '@nestjs/common';
import { AsaasWebhookEventEnum } from '../../../asaas/enums/asaas-webhook-event.enum';
import { IAsaasService } from '../../../asaas/service/i.asaas.service';
import { IAuthService } from '../../../auth/service/i.auth.service';
import { IUsersRepository } from '../../../users/repository/i.users.repository';
import { SubscriptionStatusEnum } from '../../enums/subscription-status.enum';
import {
  SubscriptionTierEnum,
  TIER_HIERARCHY,
} from '../../enums/subscription-tier.enum';
import { SubscriptionPlan } from '../../model/subscription-plan.model';
import { UserSubscription } from '../../model/user-subscription.model';
import { ISubscriptionsRepository } from '../../repository/i.subscriptions.repository';
import { CheckoutSessionResponse } from '../../responses/checkout-session.response';
import { ISubscriptionsService } from '../i.subscriptions.service';

@Injectable()
export class SubscriptionsService extends ISubscriptionsService {
  public constructor(
    @Inject(ISubscriptionsRepository)
    subscriptionsRepository: ISubscriptionsRepository,
    @Inject(IAsaasService) asaasService: IAsaasService,
    @Inject(IUsersRepository) usersRepository: IUsersRepository,
    @Inject(IAuthService) authService: IAuthService,
  ) {
    super(subscriptionsRepository, asaasService, usersRepository, authService);
  }

  public async getPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionsRepository.getActivePlans();
  }

  public async getMySubscription(userId: string): Promise<{
    subscription: UserSubscription;
    plan: SubscriptionPlan;
    pendingPlan: SubscriptionPlan | null;
  }> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!subscription) {
      const created = await this.createFreeSubscription(userId);
      const freePlan = await this.subscriptionsRepository.getFreePlan();
      return { subscription: created, plan: freePlan, pendingPlan: null };
    }

    const plan = await this.subscriptionsRepository.getPlanById(
      subscription.planId,
    );

    let pendingPlan: SubscriptionPlan | null = null;
    if (subscription.pendingPlanId) {
      pendingPlan = await this.subscriptionsRepository.getPlanById(
        subscription.pendingPlanId,
      );
    }

    return { subscription, plan, pendingPlan };
  }

  public async getUserTier(userId: string): Promise<SubscriptionTierEnum> {
    return this.subscriptionsRepository.getUserTier(userId);
  }

  public async getOrganizationOwnerTier(
    organizationId: string,
  ): Promise<SubscriptionTierEnum> {
    return this.subscriptionsRepository.getOrganizationOwnerTier(
      organizationId,
    );
  }

  public async createFreeSubscription(
    userId: string,
  ): Promise<UserSubscription> {
    return this.subscriptionsRepository.createFreeSubscription(userId);
  }

  public async changePlan(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponse | UserSubscription> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!subscription) {
      throw new Error('User has no subscription record');
    }

    const currentPlan = await this.subscriptionsRepository.getPlanById(
      subscription.planId,
    );
    const targetPlan = await this.subscriptionsRepository.getPlanById(planId);

    if (currentPlan.id === targetPlan.id) {
      return subscription;
    }

    const currentLevel = TIER_HIERARCHY[currentPlan.tier];
    const targetLevel = TIER_HIERARCHY[targetPlan.tier];

    if (currentPlan.isFree() && !targetPlan.isFree()) {
      return this.handleFreeToPayedUpgrade(userId, targetPlan);
    }

    if (targetLevel > currentLevel) {
      return this.handlePayedUpgrade(userId, subscription, targetPlan);
    }

    if (targetLevel < currentLevel) {
      return this.handleDowngrade(userId, subscription, targetPlan);
    }

    return subscription;
  }

  public async handleWebhookEvent(event: string, payload: any): Promise<void> {
    switch (event) {
      case AsaasWebhookEventEnum.PAYMENT_CONFIRMED:
      case AsaasWebhookEventEnum.PAYMENT_RECEIVED:
        await this.handlePaymentConfirmed(payload);
        break;
      case AsaasWebhookEventEnum.PAYMENT_OVERDUE:
        await this.handlePaymentOverdue(payload);
        break;
      case AsaasWebhookEventEnum.SUBSCRIPTION_INACTIVATED:
      case AsaasWebhookEventEnum.SUBSCRIPTION_DELETED:
        await this.handleSubscriptionCanceled(payload);
        break;
      default:
        break;
    }
  }

  private async handleFreeToPayedUpgrade(
    userId: string,
    targetPlan: SubscriptionPlan,
  ): Promise<CheckoutSessionResponse> {
    await this.subscriptionsRepository.setPendingPlan(userId, targetPlan.id);

    const checkoutSession = await this.asaasService.createCheckoutSession({
      planName: targetPlan.name,
      valueCents: targetPlan.priceCents,
      billingCycle: targetPlan.billingCycle ?? 'monthly',
      externalReference: userId,
    });

    return new CheckoutSessionResponse(checkoutSession.url);
  }

  private async handlePayedUpgrade(
    userId: string,
    subscription: UserSubscription,
    targetPlan: SubscriptionPlan,
  ): Promise<UserSubscription> {
    if (subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: targetPlan.priceCents / 100,
          updatePendingPayments: true,
        },
      );
    }

    if (subscription.pendingPlanId) {
      await this.subscriptionsRepository.clearPendingPlan(userId);
    }

    const updated =
      await this.subscriptionsRepository.updateUserSubscriptionPlan(
        userId,
        targetPlan.id,
      );

    await this.authService.revokeAllUserRefreshTokens(userId);

    return updated;
  }

  private async handleDowngrade(
    userId: string,
    subscription: UserSubscription,
    targetPlan: SubscriptionPlan,
  ): Promise<UserSubscription> {
    if (targetPlan.isFree()) {
      if (subscription.asaasSubscriptionId) {
        await this.asaasService.cancelSubscription(
          subscription.asaasSubscriptionId,
        );
      }

      const updated = await this.subscriptionsRepository.setPendingPlan(
        userId,
        targetPlan.id,
      );

      return updated;
    }

    if (subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: targetPlan.priceCents / 100,
          updatePendingPayments: false,
        },
      );
    }

    const updated = await this.subscriptionsRepository.setPendingPlan(
      userId,
      targetPlan.id,
    );

    return updated;
  }

  private async handlePaymentConfirmed(payload: any): Promise<void> {
    const subscriptionId =
      payload.payment?.subscription ?? payload.subscription?.id;
    const customerId =
      payload.payment?.customer ?? payload.subscription?.customer;
    const externalReference =
      payload.payment?.externalReference ??
      payload.subscription?.externalReference;

    if (!subscriptionId) {
      return;
    }

    const existingSubscription =
      await this.subscriptionsRepository.getUserSubscriptionByAsaasId(
        subscriptionId,
      );

    if (existingSubscription) {
      if (existingSubscription.pendingPlanId) {
        await this.subscriptionsRepository.applyPendingPlan(
          existingSubscription.userId,
        );
      }

      if (!existingSubscription.isActive()) {
        await this.subscriptionsRepository.updateSubscriptionStatus(
          subscriptionId,
          SubscriptionStatusEnum.ACTIVE,
        );
      }

      await this.authService.revokeAllUserRefreshTokens(
        existingSubscription.userId,
      );

      return;
    }

    if (!externalReference) {
      return;
    }

    const userId = externalReference;

    if (customerId) {
      try {
        await this.usersRepository.updateAsaasCustomerId(userId, customerId);
      } catch (error) {}
    }

    const currentSubscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!currentSubscription) {
      return;
    }

    if (currentSubscription.pendingPlanId) {
      await this.subscriptionsRepository.updateAsaasSubscriptionId(
        userId,
        subscriptionId,
      );

      await this.subscriptionsRepository.applyPendingPlan(userId);
    } else {
    }

    await this.authService.revokeAllUserRefreshTokens(userId);
  }

  private async handlePaymentOverdue(payload: any): Promise<void> {
    const subscriptionId =
      payload.payment?.subscription ?? payload.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const updated = await this.subscriptionsRepository.updateSubscriptionStatus(
      subscriptionId,
      SubscriptionStatusEnum.PAST_DUE,
    );

    if (updated) {
      await this.authService.revokeAllUserRefreshTokens(updated.userId);
    }
  }

  private async handleSubscriptionCanceled(payload: any): Promise<void> {
    const subscriptionId =
      payload.payment?.subscription ?? payload.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const subscription =
      await this.subscriptionsRepository.getUserSubscriptionByAsaasId(
        subscriptionId,
      );

    if (!subscription) {
      return;
    }

    if (subscription.pendingPlanId) {
      await this.subscriptionsRepository.applyPendingPlan(subscription.userId);
      await this.authService.revokeAllUserRefreshTokens(subscription.userId);
      return;
    }

    const freePlan = await this.subscriptionsRepository.getFreePlan();
    await this.subscriptionsRepository.updateUserSubscriptionPlan(
      subscription.userId,
      freePlan.id,
    );
    await this.subscriptionsRepository.updateSubscriptionStatus(
      subscriptionId,
      SubscriptionStatusEnum.CANCELED,
      new Date(),
    );

    await this.authService.revokeAllUserRefreshTokens(subscription.userId);
  }
}
