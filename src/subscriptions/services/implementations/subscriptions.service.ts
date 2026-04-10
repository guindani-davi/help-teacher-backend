import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import type { AsaasWebhookEventDTO } from '../../../asaas/dtos/asaas-webhook-event.dto';
import { AsaasWebhookEventEnum } from '../../../asaas/enums/asaas-webhook-event.enum';
import { IAsaasService } from '../../../asaas/services/i.asaas.service';
import { IAuthService } from '../../../auth/services/i.auth.service';
import { IUsersService } from '../../../users/services/i.users.service';
import { BillingCycleEnum } from '../../enums/billing-cycle.enum';
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
import { SubscriptionPlanResponse } from '../../models/subscription-plan-response.model';
import { SubscriptionPlan } from '../../models/subscription-plan.model';
import { UserSubscriptionResponse } from '../../models/user-subscription-response.model';
import { UserSubscription } from '../../models/user-subscription.model';
import { ISubscriptionsRepository } from '../../repositories/i.subscriptions.repository';
import { ISubscriptionsService } from '../i.subscriptions.service';

@Injectable()
export class SubscriptionsService extends ISubscriptionsService {
  private readonly logger: Logger;

  private static readonly MONTHLY_CYCLE_DAYS = 30;
  private static readonly YEARLY_CYCLE_DAYS = 365;

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

  // ─── Public read methods ─────────────────────────────────────────────

  public async getPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionsRepository.getActivePlans();
  }

  public async getPlansResponse(): Promise<SubscriptionPlanResponse[]> {
    const plans = await this.getPlans();

    return plans.map((plan) => new SubscriptionPlanResponse(plan));
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

  public async getMySubscriptionResponse(
    userId: string,
  ): Promise<UserSubscriptionResponse | null> {
    const result = await this.getMySubscription(userId);

    if (!result) {
      return null;
    }

    return new UserSubscriptionResponse(
      result.subscription,
      result.plan,
      result.pendingPlan,
    );
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

  // ─── changePlan orchestrator ─────────────────────────────────────────

  public async changePlan(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponse | UserSubscription> {
    const subscription =
      await this.subscriptionsRepository.getUserSubscription(userId);

    const targetPlan = await this.subscriptionsRepository.getPlanById(planId);

    // Case A: No subscription at all → first subscription (trial or checkout)
    if (!subscription) {
      return this.handleFirstSubscription(userId, targetPlan);
    }

    // Case B: Active trial (not expired) → plan switch during trial
    if (subscription.isTrialing() && !subscription.isTrialExpired()) {
      return this.handleTrialingPlanChange(userId, subscription, targetPlan);
    }

    // Case C: Expired trial / canceled / past_due → resubscription via checkout
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

    // Case D: Active subscription → upgrade / downgrade / lateral / no-op
    if (!subscription.isActive()) {
      throw new SubscriptionInvalidStateException();
    }

    const currentPlan = await this.subscriptionsRepository.getPlanById(
      subscription.planId,
    );

    // Same plan as pending → no-op
    if (subscription.pendingPlanId === targetPlan.id) {
      return subscription;
    }

    // Cancel any existing pending change first
    if (subscription.pendingPlanId || subscription.prorationAsaasPaymentId) {
      await this.cancelPendingChange(userId, subscription, currentPlan);
    }

    // Same plan as current → no-op
    if (currentPlan.id === targetPlan.id) {
      const refreshed =
        await this.subscriptionsRepository.getUserSubscription(userId);
      return refreshed ?? subscription;
    }

    const currentLevel = TIER_HIERARCHY[currentPlan.tier];
    const targetLevel = TIER_HIERARCHY[targetPlan.tier];

    if (targetLevel > currentLevel) {
      return this.handleUpgrade(userId, subscription, currentPlan, targetPlan);
    }

    if (targetLevel < currentLevel) {
      return this.handleDowngrade(userId, subscription, targetPlan);
    }

    return this.handleLateralPlanSwitch(userId, subscription, targetPlan);
  }

  public async changePlanResponse(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponse | UserSubscriptionResponse> {
    const result = await this.changePlan(userId, planId);

    if (result instanceof CheckoutSessionResponse) {
      return result;
    }

    const subscriptionData = await this.getMySubscription(userId);

    if (!subscriptionData) {
      throw new SubscriptionInvalidStateException();
    }

    return new UserSubscriptionResponse(
      result,
      subscriptionData.plan,
      subscriptionData.pendingPlan,
    );
  }

  // ─── Webhook dispatcher ─────────────────────────────────────────────

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

  // ─── Cancel / Reactivate ─────────────────────────────────────────────

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

    // Clean up any pending proration payment
    await this.cleanupProrationPayment(userId, subscription);

    // Clear any pending plan change
    if (subscription.pendingPlanId) {
      await this.subscriptionsRepository.clearPendingPlan(userId);
    }

    // Trial cancel → immediate
    if (subscription.isTrialing()) {
      await this.subscriptionsRepository.updateSubscriptionStatusByUserId(
        userId,
        SubscriptionStatusEnum.CANCELED,
        new Date(),
      );

      await this.authService.revokeAllUserRefreshTokens(userId);

      return;
    }

    // Past due → immediate cancel
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

    // Active → deferred cancel at period end
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

  // ─── Private: Plan change handlers ───────────────────────────────────

  private async handleFirstSubscription(
    userId: string,
    targetPlan: SubscriptionPlan,
  ): Promise<CheckoutSessionResponse | UserSubscription> {
    const user = await this.usersService.getUserById({ id: userId });

    // If user has NOT used trial → start local trial (no Asaas)
    if (!user.hasUsedTrial) {
      await this.usersService.markTrialUsed(userId);

      const trialSubscription =
        await this.subscriptionsRepository.createTrialSubscription(
          userId,
          targetPlan.id,
        );

      return trialSubscription;
    }

    // If user has already used trial → direct checkout
    const checkoutSession = await this.asaasService.createCheckoutSession({
      planName: targetPlan.name,
      valueCents: targetPlan.priceCents,
      billingCycle: targetPlan.billingCycle ?? 'monthly',
      externalReference: userId,
      nextDueDate: this.formatNextDueDate(0),
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

    // Trial is local-only: just update the plan in DB, no Asaas call
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

  private async handleUpgrade(
    userId: string,
    subscription: UserSubscription,
    currentPlan: SubscriptionPlan,
    targetPlan: SubscriptionPlan,
  ): Promise<CheckoutSessionResponse> {
    if (!subscription.asaasSubscriptionId || !subscription.currentPeriodEnd) {
      throw new SubscriptionInvalidStateException();
    }

    const user = await this.usersService.getUserById({ id: userId });

    if (!user.asaasCustomerId) {
      throw new SubscriptionInvalidStateException();
    }

    const prorationCents = this.calculateProrationCents(
      currentPlan,
      targetPlan,
      subscription.currentPeriodEnd,
    );

    if (prorationCents <= 0) {
      throw new SubscriptionInvalidStateException();
    }

    const prorationReais = prorationCents / 100;

    const payment = await this.asaasService.createPayment({
      customer: user.asaasCustomerId,
      billingType: 'UNDEFINED',
      value: prorationReais,
      dueDate: this.formatNextDueDate(0),
      description: `Upgrade proration: ${currentPlan.name} → ${targetPlan.name}`,
      externalReference: userId,
    });

    await this.subscriptionsRepository.setPendingPlan(userId, targetPlan.id);
    await this.subscriptionsRepository.setProrationPaymentId(
      userId,
      payment.id,
    );

    return new CheckoutSessionResponse(payment.invoiceUrl);
  }

  private async handleDowngrade(
    userId: string,
    subscription: UserSubscription,
    targetPlan: SubscriptionPlan,
  ): Promise<UserSubscription> {
    // Downgrade is deferred: set pendingPlan, update Asaas for next cycle
    if (subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: targetPlan.priceCents / 100,
          cycle: targetPlan.billingCycle ?? undefined,
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

  private async handleLateralPlanSwitch(
    userId: string,
    subscription: UserSubscription,
    targetPlan: SubscriptionPlan,
  ): Promise<UserSubscription> {
    // Lateral (same tier, different cycle) is deferred like downgrade
    if (subscription.asaasSubscriptionId) {
      await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: targetPlan.priceCents / 100,
          cycle: targetPlan.billingCycle ?? undefined,
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
  ): Promise<void> {
    // Clean up proration payment if there is one (upgrade was pending)
    await this.cleanupProrationPayment(userId, subscription);

    if (subscription.pendingPlanId) {
      const pendingPlan = await this.subscriptionsRepository.getPlanById(
        subscription.pendingPlanId,
      );

      const pendingLevel = TIER_HIERARCHY[pendingPlan.tier];
      const currentLevel = TIER_HIERARCHY[currentPlan.tier];

      // If it was a downgrade/lateral pending, revert Asaas subscription value
      if (pendingLevel <= currentLevel && subscription.asaasSubscriptionId) {
        await this.asaasService.updateSubscription(
          subscription.asaasSubscriptionId,
          {
            value: currentPlan.priceCents / 100,
            cycle: currentPlan.billingCycle ?? undefined,
            updatePendingPayments: false,
          },
        );
      }

      await this.subscriptionsRepository.clearPendingPlan(userId);
    }
  }

  // ─── Private: Webhook handlers ───────────────────────────────────────

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

    // Only handle subscription-linked payments here (not standalone proration)
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
    const paymentId = payload.payment?.id;
    const subscriptionId =
      payload.payment?.subscription ?? payload.subscription?.id;
    const customerId =
      payload.payment?.customer ?? payload.subscription?.customer;
    const externalReference =
      payload.payment?.externalReference ??
      payload.subscription?.externalReference;

    // 1. Check if this is a standalone proration payment
    if (paymentId) {
      const prorationSub =
        await this.subscriptionsRepository.getUserSubscriptionByProrationPaymentId(
          paymentId,
        );

      if (prorationSub) {
        await this.applyProrationUpgrade(prorationSub);
        return;
      }
    }

    // 2. Handle subscription-linked payments (regular billing cycle)
    if (!subscriptionId) {
      return;
    }

    const existingSubscription =
      await this.subscriptionsRepository.getUserSubscriptionByAsaasId(
        subscriptionId,
      );

    if (existingSubscription) {
      // Apply pending downgrade/lateral if present (and no proration pending)
      if (
        existingSubscription.pendingPlanId &&
        !existingSubscription.prorationAsaasPaymentId
      ) {
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

    // 3. First-ever payment for a new subscription (checkout just completed)
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
    const paymentId = payload.payment?.id;
    const subscriptionId =
      payload.payment?.subscription ?? payload.subscription?.id;

    // 1. Check if this is a proration payment that went overdue
    if (paymentId) {
      const prorationSub =
        await this.subscriptionsRepository.getUserSubscriptionByProrationPaymentId(
          paymentId,
        );

      if (prorationSub) {
        // Upgrade failed: clear pending state, user keeps current plan
        await this.subscriptionsRepository.clearProrationPaymentId(
          prorationSub.userId,
        );
        if (prorationSub.pendingPlanId) {
          await this.subscriptionsRepository.clearPendingPlan(
            prorationSub.userId,
          );
        }

        this.logger.warn(
          `Proration payment ${paymentId} went overdue for user ${prorationSub.userId}. Upgrade cancelled.`,
        );

        return;
      }
    }

    // 2. Handle subscription-linked payment overdue
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

  // ─── Private: Proration helpers ──────────────────────────────────────

  private async applyProrationUpgrade(
    subscription: UserSubscription,
  ): Promise<void> {
    if (!subscription.pendingPlanId) {
      this.logger.warn(
        `Proration payment confirmed but no pendingPlanId for user ${subscription.userId}`,
      );
      return;
    }

    const targetPlan = await this.subscriptionsRepository.getPlanById(
      subscription.pendingPlanId,
    );

    // Update DB: apply the upgrade
    await this.subscriptionsRepository.updateUserSubscriptionPlan(
      subscription.userId,
      targetPlan.id,
    );
    await this.subscriptionsRepository.clearPendingPlan(subscription.userId);
    await this.subscriptionsRepository.clearProrationPaymentId(
      subscription.userId,
    );

    // Update Asaas subscription for future billing at new plan price
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

    await this.authService.revokeAllUserRefreshTokens(subscription.userId);

    this.logger.log(
      `Proration upgrade applied for user ${subscription.userId} → plan ${targetPlan.name}`,
    );
  }

  private calculateProrationCents(
    currentPlan: SubscriptionPlan,
    targetPlan: SubscriptionPlan,
    currentPeriodEnd: Date,
  ): number {
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    if (daysRemaining === 0) {
      return 0;
    }

    const currentCycleDays = this.cycleToDays(currentPlan.billingCycle);
    const targetCycleDays = this.cycleToDays(targetPlan.billingCycle);

    const oldDailyRate = currentPlan.priceCents / currentCycleDays;
    const newDailyRate = targetPlan.priceCents / targetCycleDays;

    return Math.round(daysRemaining * (newDailyRate - oldDailyRate));
  }

  private cycleToDays(cycle: BillingCycleEnum | null): number {
    if (cycle === BillingCycleEnum.YEARLY) {
      return SubscriptionsService.YEARLY_CYCLE_DAYS;
    }

    return SubscriptionsService.MONTHLY_CYCLE_DAYS;
  }

  private async cleanupProrationPayment(
    userId: string,
    subscription: UserSubscription,
  ): Promise<void> {
    if (!subscription.prorationAsaasPaymentId) {
      return;
    }

    try {
      await this.asaasService.deletePayment(
        subscription.prorationAsaasPaymentId,
      );
    } catch {
      this.logger.warn(
        `Failed to delete proration payment ${subscription.prorationAsaasPaymentId} for user ${userId}`,
      );
    }

    await this.subscriptionsRepository.clearProrationPaymentId(userId);
  }

  // ─── Private: Utility ────────────────────────────────────────────────

  private formatNextDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().slice(0, 10);
  }
}
