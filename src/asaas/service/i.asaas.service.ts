import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AsaasCheckoutSession,
  AsaasSubscription,
  CreateCheckoutSessionParams,
  UpdateAsaasSubscriptionParams,
} from '../types/asaas.types';

@Injectable()
export abstract class IAsaasService {
  protected readonly configService: ConfigService;

  public constructor(configService: ConfigService) {
    this.configService = configService;
  }

  public abstract createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<AsaasCheckoutSession>;
  public abstract getSubscription(
    asaasSubscriptionId: string,
  ): Promise<AsaasSubscription>;
  public abstract updateSubscription(
    asaasSubscriptionId: string,
    params: UpdateAsaasSubscriptionParams,
  ): Promise<AsaasSubscription>;
  public abstract cancelSubscription(
    asaasSubscriptionId: string,
  ): Promise<void>;
}
