import { Injectable } from '@nestjs/common';
import { CreateCheckoutSessionParamsDTO } from '../dtos/create-checkout-session-params.dto';
import { UpdateAsaasSubscriptionParamsDTO } from '../dtos/update-asaas-subscription-params.dto';
import { AsaasCheckoutSession } from '../models/asaas-checkout-session.model';
import { AsaasSubscription } from '../models/asaas-subscription.model';

@Injectable()
export abstract class IAsaasService {
  public constructor() {}

  public abstract createCheckoutSession(
    params: CreateCheckoutSessionParamsDTO,
  ): Promise<AsaasCheckoutSession>;
  public abstract getSubscription(
    asaasSubscriptionId: string,
  ): Promise<AsaasSubscription>;
  public abstract updateSubscription(
    asaasSubscriptionId: string,
    params: UpdateAsaasSubscriptionParamsDTO,
  ): Promise<AsaasSubscription>;
  public abstract cancelSubscription(
    asaasSubscriptionId: string,
  ): Promise<void>;
}
