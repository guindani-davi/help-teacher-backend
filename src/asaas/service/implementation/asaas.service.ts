import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsaasApiException } from '../../exceptions/asaas-api.exception';
import {
  AsaasCheckoutSession,
  AsaasSubscription,
  CreateCheckoutSessionParams,
  UpdateAsaasSubscriptionParams,
} from '../../types/asaas.types';
import { IAsaasService } from '../i.asaas.service';

@Injectable()
export class AsaasService extends IAsaasService {
  private static readonly CHECKOUT_EXPIRES_MINUTES = 30;

  private readonly logger = new Logger(AsaasService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  public constructor(@Inject(ConfigService) configService: ConfigService) {
    super(configService);
    this.apiUrl = this.configService.getOrThrow<string>('ASAAS_API_URL');
    this.apiKey = this.configService.getOrThrow<string>('ASAAS_API_KEY');
    this.successUrl = this.configService.getOrThrow<string>(
      'ASAAS_CHECKOUT_SUCCESS_URL',
    );
    this.cancelUrl = this.configService.getOrThrow<string>(
      'ASAAS_CHECKOUT_CANCEL_URL',
    );
  }

  public async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<AsaasCheckoutSession> {
    const today = new Date().toISOString().split('T')[0];

    const body = {
      chargeTypes: ['RECURRENT'],
      billingTypes: ['CREDIT_CARD'],
      items: [
        {
          name: params.planName,
          value: params.valueCents / 100,
          quantity: 1,
        },
      ],
      subscription: {
        cycle: params.billingCycle.toUpperCase(),
        nextDueDate: today,
      },
      callback: {
        successUrl: this.successUrl,
        cancelUrl: this.cancelUrl,
      },
      externalReference: params.externalReference,
      ...(params.customerName || params.customerEmail
        ? {
            customerData: {
              ...(params.customerName ? { name: params.customerName } : {}),
              ...(params.customerEmail ? { email: params.customerEmail } : {}),
            },
          }
        : {}),
      minutesToExpire: AsaasService.CHECKOUT_EXPIRES_MINUTES,
    };

    const response = await this.request<{ url: string }>(
      'POST',
      '/v3/checkouts',
      body,
    );

    return {
      url: response.url,
      expiresInMinutes: AsaasService.CHECKOUT_EXPIRES_MINUTES,
    };
  }

  public async getSubscription(
    asaasSubscriptionId: string,
  ): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(
      'GET',
      `/v3/subscriptions/${asaasSubscriptionId}`,
    );
  }

  public async updateSubscription(
    asaasSubscriptionId: string,
    params: UpdateAsaasSubscriptionParams,
  ): Promise<AsaasSubscription> {
    const body: Record<string, unknown> = {};

    if (params.value !== undefined) {
      body.value = params.value;
    }

    if (params.cycle !== undefined) {
      body.cycle = params.cycle;
    }

    if (params.updatePendingPayments !== undefined) {
      body.updatePendingPayments = params.updatePendingPayments;
    }

    return this.request<AsaasSubscription>(
      'PUT',
      `/v3/subscriptions/${asaasSubscriptionId}`,
      body,
    );
  }

  public async cancelSubscription(asaasSubscriptionId: string): Promise<void> {
    await this.request<unknown>(
      'DELETE',
      `/v3/subscriptions/${asaasSubscriptionId}`,
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;

    const headers: Record<string, string> = {
      access_token: this.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorDetails = '';

      try {
        const errorBody = await response.text();
        errorDetails = `ASAAS API error: ${response.status} ${response.statusText} - ${errorBody}`;
      } catch {
        errorDetails = `ASAAS API error: ${response.status} ${response.statusText}`;
      }

      this.logger.error(errorDetails);
      throw new AsaasApiException(errorDetails);
    }

    if (method === 'DELETE') {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
