import { Inject, Injectable, Logger } from '@nestjs/common';
import { AsaasWebhookEventEnum } from '../../../asaas/enums/asaas-webhook-event.enum';
import { IAsaasService } from '../../../asaas/service/i.asaas.service';
import { IAuthService } from '../../../auth/service/i.auth.service';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { IUsersRepository } from '../../../users/repository/i.users.repository';
import { SubscriptionStatusEnum } from '../../enums/subscription-status.enum';
import {
  SubscriptionTierEnum,
  TIER_HIERARCHY,
} from '../../enums/subscription-tier.enum';
import { ActiveSubscriptionRequiredException } from '../../exceptions/active-subscription-required.exception';
import { SubscriptionPlan } from '../../model/subscription-plan.model';
import { UserSubscription } from '../../model/user-subscription.model';
import { ISubscriptionsRepository } from '../../repository/i.subscriptions.repository';
import { CheckoutSessionResponse } from '../../responses/checkout-session.response';
import { ISubscriptionsService } from '../i.subscriptions.service';

@Injectable()
export class SubscriptionsService extends ISubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

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
    subscription: UserSubscription | null;
    plan: SubscriptionPlan | null;
  }> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!subscription) {
      return { subscription: null, plan: null };
    }

    const plan = await this.subscriptionsRepository.getPlanById(
      subscription.planId,
    );

    return { subscription, plan };
  }

  public async getUserTier(userId: string): Promise<SubscriptionTierEnum> {
    return this.subscriptionsRepository.getUserTier(userId);
  }

  public async subscribe(
    userId: string,
    planId: string,
    userName: string,
    userEmail: string,
  ): Promise<CheckoutSessionResponse> {
    const plan = await this.subscriptionsRepository.getPlanById(planId);

    if (plan.isFree()) {
      throw new ActiveSubscriptionRequiredException();
    }

    const existingSubscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (
      existingSubscription &&
      existingSubscription.isActive() &&
      existingSubscription.asaasSubscriptionId
    ) {
      throw new EntityAlreadyExistsException('UserSubscription');
    }

    const checkoutSession = await this.asaasService.createCheckoutSession({
      planName: plan.name,
      valueCents: plan.priceCents,
      billingCycle: plan.billingCycle ?? 'monthly',
      externalReference: userId,
      customerName: userName,
      customerEmail: userEmail,
    });

    return new CheckoutSessionResponse(
      checkoutSession.url,
      checkoutSession.expiresInMinutes,
    );
  }

  public async changePlan(
    userId: string,
    planId: string,
  ): Promise<UserSubscription> {
    const currentSubscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (
      !currentSubscription ||
      !currentSubscription.isActive() ||
      !currentSubscription.asaasSubscriptionId
    ) {
      throw new ActiveSubscriptionRequiredException();
    }

    const currentPlan = await this.subscriptionsRepository.getPlanById(
      currentSubscription.planId,
    );
    const targetPlan = await this.subscriptionsRepository.getPlanById(planId);

    const currentLevel = TIER_HIERARCHY[currentPlan.tier];
    const targetLevel = TIER_HIERARCHY[targetPlan.tier];

    if (targetLevel > currentLevel) {
      await this.asaasService.updateSubscription(
        currentSubscription.asaasSubscriptionId,
        {
          value: targetPlan.priceCents / 100,
          updatePendingPayments: true,
        },
      );

      const updated =
        await this.subscriptionsRepository.updateUserSubscriptionPlan(
          userId,
          planId,
        );

      await this.authService.revokeAllUserRefreshTokens(userId);

      return updated;
    }

    if (targetLevel < currentLevel) {
      await this.validateDowngrade(userId, currentPlan.tier, targetPlan.tier);

      if (targetPlan.isFree()) {
        await this.asaasService.cancelSubscription(
          currentSubscription.asaasSubscriptionId,
        );

        await this.subscriptionsRepository.updateSubscriptionStatus(
          currentSubscription.asaasSubscriptionId,
          SubscriptionStatusEnum.CANCELED,
          new Date(),
        );
      } else {
        await this.asaasService.updateSubscription(
          currentSubscription.asaasSubscriptionId,
          {
            value: targetPlan.priceCents / 100,
            updatePendingPayments: true,
          },
        );

        await this.subscriptionsRepository.updateUserSubscriptionPlan(
          userId,
          planId,
        );
      }

      await this.authService.revokeAllUserRefreshTokens(userId);

      const updatedSubscription =
        await this.subscriptionsRepository.getUserSubscription(userId);

      return updatedSubscription!;
    }

    return currentSubscription;
  }

  public async cancel(userId: string): Promise<void> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (
      !subscription ||
      !subscription.isActive() ||
      !subscription.asaasSubscriptionId
    ) {
      throw new ActiveSubscriptionRequiredException();
    }

    await this.asaasService.cancelSubscription(
      subscription.asaasSubscriptionId,
    );

    await this.subscriptionsRepository.updateSubscriptionStatus(
      subscription.asaasSubscriptionId,
      SubscriptionStatusEnum.CANCELED,
      new Date(),
    );

    await this.authService.revokeAllUserRefreshTokens(userId);
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
        this.logger.log(`Unhandled webhook event: ${event}`);
    }
  }

  protected async validateDowngrade(
    _userId: string,
    _fromTier: SubscriptionTierEnum,
    _toTier: SubscriptionTierEnum,
  ): Promise<void> {
    return;
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
      this.logger.warn('Payment confirmed webhook without subscription ID');
      return;
    }

    const existingSubscription =
      await this.subscriptionsRepository.getUserSubscriptionByAsaasId(
        subscriptionId,
      );

    if (existingSubscription) {
      if (!existingSubscription.isActive()) {
        await this.subscriptionsRepository.updateSubscriptionStatus(
          subscriptionId,
          SubscriptionStatusEnum.ACTIVE,
        );

        await this.authService.revokeAllUserRefreshTokens(
          existingSubscription.userId,
        );
      }
      return;
    }

    if (!externalReference) {
      this.logger.warn(
        'Payment confirmed webhook without external reference for new subscription',
      );
      return;
    }

    const userId = externalReference;

    if (customerId) {
      try {
        await this.usersRepository.updateAsaasCustomerId(userId, customerId);
      } catch (error) {
        this.logger.warn(
          `Failed to update ASAAS customer ID for user ${userId}`,
        );
      }
    }

    const asaasSubscription =
      await this.asaasService.getSubscription(subscriptionId);

    const plans = await this.subscriptionsRepository.getActivePlans();
    const matchingPlan = plans.find(
      (p) => p.priceCents === Math.round(asaasSubscription.value * 100),
    );

    if (!matchingPlan) {
      this.logger.error(
        `No matching plan found for ASAAS subscription value: ${asaasSubscription.value}`,
      );
      return;
    }

    try {
      await this.subscriptionsRepository.createUserSubscription(
        userId,
        matchingPlan.id,
        subscriptionId,
      );
    } catch (error) {
      if (error instanceof EntityAlreadyExistsException) {
        this.logger.warn(
          `User ${userId} already has a subscription, updating instead`,
        );
        await this.subscriptionsRepository.updateUserSubscriptionPlan(
          userId,
          matchingPlan.id,
        );
      } else {
        throw error;
      }
    }

    await this.authService.revokeAllUserRefreshTokens(userId);
  }

  private async handlePaymentOverdue(payload: any): Promise<void> {
    const subscriptionId =
      payload.payment?.subscription ?? payload.subscription?.id;

    if (!subscriptionId) {
      this.logger.warn('Payment overdue webhook without subscription ID');
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
      this.logger.warn('Subscription canceled webhook without subscription ID');
      return;
    }

    const updated = await this.subscriptionsRepository.updateSubscriptionStatus(
      subscriptionId,
      SubscriptionStatusEnum.CANCELED,
      new Date(),
    );

    if (updated) {
      await this.authService.revokeAllUserRefreshTokens(updated.userId);
    }
  }
}
