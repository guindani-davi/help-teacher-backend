import { Injectable } from '@nestjs/common';
import { IAsaasService } from '../../asaas/service/i.asaas.service';
import { IAuthService } from '../../auth/service/i.auth.service';
import { IUsersRepository } from '../../users/repository/i.users.repository';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';
import { SubscriptionPlan } from '../model/subscription-plan.model';
import { UserSubscription } from '../model/user-subscription.model';
import { ISubscriptionsRepository } from '../repository/i.subscriptions.repository';
import { CheckoutSessionResponse } from '../responses/checkout-session.response';

@Injectable()
export abstract class ISubscriptionsService {
  protected readonly subscriptionsRepository: ISubscriptionsRepository;
  protected readonly asaasService: IAsaasService;
  protected readonly usersRepository: IUsersRepository;
  protected readonly authService: IAuthService;

  public constructor(
    subscriptionsRepository: ISubscriptionsRepository,
    asaasService: IAsaasService,
    usersRepository: IUsersRepository,
    authService: IAuthService,
  ) {
    this.subscriptionsRepository = subscriptionsRepository;
    this.asaasService = asaasService;
    this.usersRepository = usersRepository;
    this.authService = authService;
  }

  public abstract getPlans(): Promise<SubscriptionPlan[]>;
  public abstract getMySubscription(userId: string): Promise<{
    subscription: UserSubscription;
    plan: SubscriptionPlan;
    pendingPlan: SubscriptionPlan | null;
  }>;
  public abstract getUserTier(userId: string): Promise<SubscriptionTierEnum>;
  public abstract getOrganizationOwnerTier(
    organizationId: string,
  ): Promise<SubscriptionTierEnum>;
  public abstract createFreeSubscription(
    userId: string,
  ): Promise<UserSubscription>;
  public abstract changePlan(
    userId: string,
    planId: string,
  ): Promise<CheckoutSessionResponse | UserSubscription>;
  public abstract handleWebhookEvent(
    event: string,
    payload: any,
  ): Promise<void>;
}
