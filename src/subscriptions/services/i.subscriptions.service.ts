import { Injectable } from '@nestjs/common';
import type { AsaasWebhookEventDTO } from '../../asaas/dtos/asaas-webhook-event.dto';
import { IAsaasService } from '../../asaas/services/i.asaas.service';
import { IAuthService } from '../../auth/services/i.auth.service';
import { IUsersService } from '../../users/services/i.users.service';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';
import { CheckoutSessionResponse } from '../models/checkout-session-response.model';
import { SubscriptionPlanResponse } from '../models/subscription-plan-response.model';
import { SubscriptionPlan } from '../models/subscription-plan.model';
import { UserSubscriptionResponse } from '../models/user-subscription-response.model';
import { UserSubscription } from '../models/user-subscription.model';
import { ISubscriptionsRepository } from '../repositories/i.subscriptions.repository';

@Injectable()
export abstract class ISubscriptionsService {
  protected readonly subscriptionsRepository: ISubscriptionsRepository;
  protected readonly asaasService: IAsaasService;
  protected readonly usersService: IUsersService;
  protected readonly authService: IAuthService;

  public constructor(
    subscriptionsRepository: ISubscriptionsRepository,
    asaasService: IAsaasService,
    usersService: IUsersService,
    authService: IAuthService,
  ) {
    this.subscriptionsRepository = subscriptionsRepository;
    this.asaasService = asaasService;
    this.usersService = usersService;
    this.authService = authService;
  }

  public abstract getPlans(): Promise<SubscriptionPlan[]>;
  public abstract getPlansResponse(): Promise<SubscriptionPlanResponse[]>;
  public abstract getMySubscription(userId: string): Promise<{
    subscription: UserSubscription;
    plan: SubscriptionPlan;
    pendingPlan: SubscriptionPlan | null;
  } | null>;
  public abstract getMySubscriptionResponse(
    userId: string,
  ): Promise<UserSubscriptionResponse | null>;
  public abstract getUserTier(
    userId: string,
  ): Promise<SubscriptionTierEnum | null>;
  public abstract getOrganizationOwnerTier(
    organizationId: string,
  ): Promise<SubscriptionTierEnum | null>;
  public abstract changePlan(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponse | UserSubscription>;
  public abstract changePlanResponse(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponse | UserSubscriptionResponse>;
  public abstract handleWebhookEvent(
    event: string,
    payload: AsaasWebhookEventDTO,
  ): Promise<void>;
  public abstract cancelSubscription(userId: string): Promise<void>;
  public abstract reactivateSubscription(userId: string): Promise<void>;
}
