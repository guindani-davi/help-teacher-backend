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
    subscription: UserSubscription | null;
    plan: SubscriptionPlan | null;
  }>;
  public abstract getUserTier(userId: string): Promise<SubscriptionTierEnum>;
  public abstract subscribe(
    userId: string,
    planId: string,
    userName: string,
    userEmail: string,
  ): Promise<CheckoutSessionResponse>;
  public abstract changePlan(
    userId: string,
    planId: string,
  ): Promise<UserSubscription>;
  public abstract cancel(userId: string): Promise<void>;
  public abstract handleWebhookEvent(
    event: string,
    payload: any,
  ): Promise<void>;
  protected abstract validateDowngrade(
    userId: string,
    fromTier: SubscriptionTierEnum,
    toTier: SubscriptionTierEnum,
  ): Promise<void>;
}
