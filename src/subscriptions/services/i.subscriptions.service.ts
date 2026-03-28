import { Injectable } from '@nestjs/common';
import { IUsersService } from 'src/users/services/i.users.service';
import type { AsaasWebhookEventDTO } from '../../asaas/dtos/asaas-webhook-event.dto';
import { IAsaasService } from '../../asaas/services/i.asaas.service';
import { IAuthService } from '../../auth/services/i.auth.service';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';
import { CheckoutSessionResponse } from '../models/checkout-session-response.model';
import { SubscriptionPlan } from '../models/subscription-plan.model';
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
  public abstract getMySubscription(userId: string): Promise<{
    subscription: UserSubscription;
    plan: SubscriptionPlan;
    pendingPlan: SubscriptionPlan | null;
  } | null>;
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
  public abstract handleWebhookEvent(
    event: string,
    payload: AsaasWebhookEventDTO,
  ): Promise<void>;
  public abstract cancelSubscription(userId: string): Promise<void>;
  public abstract reactivateSubscription(userId: string): Promise<void>;
}
