import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { IUsersService } from 'src/users/services/i.users.service';
import type { AsaasWebhookEventDTO } from '../../../asaas/dtos/asaas-webhook-event.dto';
import { AsaasWebhookEventEnum } from '../../../asaas/enums/asaas-webhook-event.enum';
import { IAsaasService } from '../../../asaas/services/i.asaas.service';
import { IAuthService } from '../../../auth/services/i.auth.service';
import { SubscriptionStatusEnum } from '../../enums/subscription-status.enum';
import {
  SubscriptionTierEnum,
  TIER_HIERARCHY,
} from '../../enums/subscription-tier.enum';
import { SubscriptionAlreadyCancelingException } from '../../exceptions/subscription-already-canceling.exception';
import { SubscriptionCancelNotAllowedException } from '../../exceptions/subscription-cancel-not-allowed.exception';
import { SubscriptionInvalidStateException } from '../../exceptions/subscription-invalid-state.exception';
import { SubscriptionNotCancelingException } from '../../exceptions/subscription-not-canceling.exception';
import { CheckoutSessionResponse } from '../../models/checkout-session-response.model';
import { SubscriptionPlan } from '../../models/subscription-plan.model';
import { UserSubscription } from '../../models/user-subscription.model';
import { ISubscriptionsRepository } from '../../repositories/i.subscriptions.repository';
import { ISubscriptionsService } from '../i.subscriptions.service';

@Injectable()
export class SubscriptionsService extends ISubscriptionsService {
  private readonly logger: Logger;

  public constructor(
    @Inject(ISubscriptionsRepository)
    subscriptionsRepository: ISubscriptionsRepository,
    @Inject(forwardRef(() => IAsaasService)) asaasService: IAsaasService,
    @Inject(IUsersService) usersService: IUsersService,
    @Inject(IAuthService) authService: IAuthService,
  ) {
    super(subscriptionsRepository, asaasService, usersService, authService);
    this.logger = new Logger(SubscriptionsService.name);
  }

  public async getPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionsRepository.getActivePlans();
  }

  public async getMySubscription(userId: string): Promise<{
    subscription: UserSubscription;
    plan: SubscriptionPlan;
    pendingPlan: SubscriptionPlan | null;
  } | null> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!subscription) {
      return null;
    }

    const validations: Promise<unknown>[] = [
      this.subscriptionsRepository.getPlanById(subscription.planId),
    ];
    if (subscription.pendingPlanId) {
      validations.push(
        this.subscriptionsRepository.getPlanById(subscription.pendingPlanId),
      );
    }
    const [plan, pendingPlan] = (await Promise.all(validations)) as [
      SubscriptionPlan,
      SubscriptionPlan?,
    ];

    return { subscription, plan, pendingPlan: pendingPlan ?? null };
  }

  public async getUserTier(
    userId: string,
  ): Promise<SubscriptionTierEnum | null> {
    return this.subscriptionsRepository.getUserTier(userId);
  }

  public async getOrganizationOwnerTier(
    organizationId: string,
  ): Promise<SubscriptionTierEnum | null> {
    return this.subscriptionsRepository.getOrganizationOwnerTier(
      organizationId,
    );
  }

  public async changePlan(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponse | UserSubscription> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    const targetPlan = await this.subscriptionsRepository.getPlanById(planId);

    if (!subscription) {
      return this.handleFirstSubscription(userId, targetPlan);
    }

    if (subscription.isTrialing() && !subscription.isTrialExpired()) {
      return this.handleTrialingPlanChange(userId, subscription, targetPlan);
    }

    if (
      subscription.status === SubscriptionStatusEnum.PAST_DUE ||
      subscription.status === SubscriptionStatusEnum.CANCELED ||
      (subscription.isTrialing() && subscription.isTrialExpired())
    ) {
      if (subscription.asaasSubscriptionId) {
        try {
          await this.asaasService.cancelSubscription(
            subscription.asaasSubscriptionId,
          );
        } catch {
          this.logger.warn(
            `Failed to cancel old Asaas subscription ${subscription.asaasSubscriptionId} for user ${userId}`,
          );
        }
      }

      return this.handleResubscription(userId, targetPlan);
    }

    if (!subscription.isActive()) {
      throw new SubscriptionInvalidStateException();
    }

    const currentPlan = await this.subscriptionsRepository.getPlanById(
      subscription.planId,
    );

    if (subscription.pendingPlanId === targetPlan.id) {
      return subscription;
    }

    if (subscription.pendingPlanId) {
      await this.cancelPendingChange(userId, subscription, currentPlan);
    }

    if (currentPlan.id === targetPlan.id) {
      return subscription;
    }

    const currentLevel = TIER_HIERARCHY[currentPlan.tier];
    const targetLevel = TIER_HIERARCHY[targetPlan.tier];

    if (targetLevel > currentLevel) {
      return this.handlePayedUpgrade(userId, subscription, targetPlan);
    }

    if (targetLevel < currentLevel) {
      return this.handleDowngrade(userId, subscription, targetPlan);
    }

    return this.handleLateralPlanSwitch(userId, subscription, targetPlan);
  }

  public async handleWebhookEvent(
    event: string,
    payload: AsaasWebhookEventDTO,
  ): Promise<void> {
    switch (event) {
      case AsaasWebhookEventEnum.PAYMENT_CREATED:
        await this.handlePaymentCreated(payload);
        break;
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

  private formatNextDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().slice(0, 10);
  }

  private async handleFirstSubscription(
    userId: string,
    targetPlan: SubscriptionPlan,
  ): Promise<CheckoutSessionResponse> {
    const checkoutSession = await this.asaasService.createCheckoutSession({
      planName: targetPlan.name,
      valueCents: targetPlan.priceCents,
      billingCycle: targetPlan.billingCycle ?? 'monthly',
      externalReference: userId,
      nextDueDate: this.formatNextDueDate(7),
    });

    await this.subscriptionsRepository.createTrialSubscription(
      userId,
      targetPlan.id,
    );

    return new CheckoutSessionResponse(checkoutSession.url);
  }

  private async handleTrialingPlanChange(
    userId: string,
    subscription: UserSubscription,
    targetPlan: SubscriptionPlan,
  ): Promise<UserSubscription> {
    if (subscription.planId === targetPlan.id) {
      return subscription;
    }

    if (subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: targetPlan.priceCents / 100,
          cycle: targetPlan.billingCycle ?? undefined,
          updatePendingPayments: true,
        },
      );
    }

    const updated =
      await this.subscriptionsRepository.updateUserSubscriptionPlan(
        userId,
        targetPlan.id,
      );

    await this.authService.revokeAllUserRefreshTokens(userId);

    return updated;
  }

  private async handleResubscription(
    userId: string,
    targetPlan: SubscriptionPlan,
  ): Promise<CheckoutSessionResponse> {
    await this.subscriptionsRepository.resetForResubscription(
      userId,
      targetPlan.id,
    );

    const checkoutSession = await this.asaasService.createCheckoutSession({
      planName: targetPlan.name,
      valueCents: targetPlan.priceCents,
      billingCycle: targetPlan.billingCycle ?? 'monthly',
      externalReference: userId,
      nextDueDate: this.formatNextDueDate(0),
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

  private async cancelPendingChange(
    userId: string,
    subscription: UserSubscription,
    currentPlan: SubscriptionPlan,
  ): Promise<UserSubscription> {
    const pendingPlan = await this.subscriptionsRepository.getPlanById(
      subscription.pendingPlanId!,
    );

    const pendingLevel = TIER_HIERARCHY[pendingPlan.tier];
    const currentLevel = TIER_HIERARCHY[currentPlan.tier];

    if (pendingLevel < currentLevel && subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: currentPlan.priceCents / 100,
          updatePendingPayments: false,
        },
      );
    }

    return this.subscriptionsRepository.clearPendingPlan(userId);
  }

  private async handleLateralPlanSwitch(
    userId: string,
    subscription: UserSubscription,
    targetPlan: SubscriptionPlan,
  ): Promise<UserSubscription> {
    if (subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: targetPlan.priceCents / 100,
          cycle: targetPlan.billingCycle ?? undefined,
          updatePendingPayments: true,
        },
      );
    }

    const updated =
      await this.subscriptionsRepository.updateUserSubscriptionPlan(
        userId,
        targetPlan.id,
      );

    await this.authService.revokeAllUserRefreshTokens(userId);

    return updated;
  }

  private async handlePaymentCreated(
    payload: AsaasWebhookEventDTO,
  ): Promise<void> {
    const subscriptionId =
      payload.payment?.subscription ?? payload.subscription?.id;
    const customerId =
      payload.payment?.customer ?? payload.subscription?.customer;
    const externalReference =
      payload.payment?.externalReference ??
      payload.subscription?.externalReference;

    if (!subscriptionId || !externalReference) {
      return;
    }

    const userId = externalReference;

    if (customerId) {
      try {
        await this.usersService.updateAsaasCustomerId(userId, customerId);
      } catch {
        this.logger.warn(
          `Failed to update ASAAS customer ID for user ${userId}`,
        );
      }
    }

    const currentSubscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!currentSubscription) {
      return;
    }

    if (!currentSubscription.asaasSubscriptionId) {
      await this.subscriptionsRepository.updateAsaasSubscriptionId(
        userId,
        subscriptionId,
      );
    }
  }

  private async handlePaymentConfirmed(
    payload: AsaasWebhookEventDTO,
  ): Promise<void> {
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
        await this.usersService.updateAsaasCustomerId(userId, customerId);
      } catch {
        this.logger.warn(
          `Failed to update ASAAS customer ID for user ${userId}`,
        );
      }
    }

    const currentSubscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!currentSubscription) {
      return;
    }

    if (!currentSubscription.asaasSubscriptionId) {
      await this.subscriptionsRepository.updateAsaasSubscriptionId(
        userId,
        subscriptionId,
      );
    }

    if (!currentSubscription.isActive()) {
      await this.subscriptionsRepository.updateSubscriptionStatus(
        subscriptionId,
        SubscriptionStatusEnum.ACTIVE,
      );
    }

    await this.authService.revokeAllUserRefreshTokens(userId);
  }

  private async handlePaymentOverdue(
    payload: AsaasWebhookEventDTO,
  ): Promise<void> {
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

  private async handleSubscriptionCanceled(
    payload: AsaasWebhookEventDTO,
  ): Promise<void> {
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

    await this.subscriptionsRepository.updateSubscriptionStatus(
      subscriptionId,
      SubscriptionStatusEnum.CANCELED,
      new Date(),
    );

    await this.authService.revokeAllUserRefreshTokens(subscription.userId);
  }

  public async cancelSubscription(userId: string): Promise<void> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!subscription) {
      throw new SubscriptionCancelNotAllowedException();
    }

    if (subscription.cancelAtPeriodEnd) {
      throw new SubscriptionAlreadyCancelingException();
    }

    if (
      subscription.status === SubscriptionStatusEnum.CANCELED ||
      (subscription.isTrialing() && subscription.isTrialExpired())
    ) {
      throw new SubscriptionCancelNotAllowedException();
    }

    if (subscription.status === SubscriptionStatusEnum.PAST_DUE) {
      if (subscription.asaasSubscriptionId) {
        try {
          await this.asaasService.cancelSubscription(
            subscription.asaasSubscriptionId,
          );
        } catch {
          this.logger.warn(
            `Failed to cancel Asaas subscription ${subscription.asaasSubscriptionId} for user ${userId}`,
          );
        }

        await this.subscriptionsRepository.updateSubscriptionStatus(
          subscription.asaasSubscriptionId,
          SubscriptionStatusEnum.CANCELED,
          new Date(),
        );
      }

      await this.authService.revokeAllUserRefreshTokens(userId);

      return;
    }

    let periodEnd: Date | undefined;

    if (subscription.asaasSubscriptionId) {
      const asaasSub = await this.asaasService.getSubscription(
        subscription.asaasSubscriptionId,
      );

      const nextDueDate = new Date(asaasSub.nextDueDate);
      const endDate = new Date(nextDueDate);
      endDate.setDate(endDate.getDate() - 1);

      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        { endDate: endDate.toISOString().slice(0, 10) },
      );

      periodEnd = nextDueDate;
    } else if (subscription.isTrialing() && subscription.trialEndsAt) {
      periodEnd = subscription.trialEndsAt;
    }

    await this.subscriptionsRepository.setCancelAtPeriodEnd(
      userId,
      true,
      periodEnd,
    );

    await this.authService.revokeAllUserRefreshTokens(userId);
  }

  public async reactivateSubscription(userId: string): Promise<void> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    if (!subscription) {
      throw new SubscriptionCancelNotAllowedException();
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new SubscriptionNotCancelingException();
    }

    if (
      subscription.status === SubscriptionStatusEnum.CANCELED ||
      (subscription.isTrialing() && subscription.isTrialExpired())
    ) {
      throw new SubscriptionCancelNotAllowedException();
    }

    if (subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        { endDate: null },
      );
    }

    await this.subscriptionsRepository.setCancelAtPeriodEnd(userId, false);

    await this.authService.revokeAllUserRefreshTokens(userId);
  }
}
