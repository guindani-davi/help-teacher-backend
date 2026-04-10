import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutSessionParamsDTO } from '../../dtos/create-checkout-session-params.dto';
import { CreatePaymentParamsDTO } from '../../dtos/create-payment-params.dto';
import { UpdateAsaasSubscriptionParamsDTO } from '../../dtos/update-asaas-subscription-params.dto';
import { AsaasApiException } from '../../exceptions/asaas-api.exception';
import { AsaasCheckoutSession } from '../../models/asaas-checkout-session.model';
import { AsaasPayment } from '../../models/asaas-payment.model';
import { AsaasSubscription } from '../../models/asaas-subscription.model';
import { IAsaasService } from '../i.asaas.service';

@Injectable()
export class AsaasService extends IAsaasService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly configService: ConfigService;

  public constructor(@Inject(ConfigService) configService: ConfigService) {
    super();
    this.configService = configService;
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
    params: CreateCheckoutSessionParamsDTO,
  ): Promise<AsaasCheckoutSession> {
    const body = {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      externalReference: params.externalReference,
      callback: {
        successUrl: this.successUrl,
        cancelUrl: this.cancelUrl,
      },
      items: [
        {
          name: params.planName,
          value: params.valueCents / 100,
          quantity: 1,
          description: params.planName,
        },
      ],
      subscription: {
        cycle: params.billingCycle.toUpperCase(),
        nextDueDate: params.nextDueDate,
      },
    };

    const response = await this.request<{ link: string }>(
      'POST',
      '/v3/checkouts',
      body,
    );

    return new AsaasCheckoutSession(response.link);
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
    params: UpdateAsaasSubscriptionParamsDTO,
  ): Promise<AsaasSubscription> {
    const body: Record<string, unknown> = {};

    if (params.value !== undefined) {
      body.value = params.value;
    }

    if (params.cycle !== undefined) {
      body.cycle = params.cycle;
    }

    if (params.endDate !== undefined) {
      body.endDate = params.endDate;
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

  public async createPayment(
    params: CreatePaymentParamsDTO,
  ): Promise<AsaasPayment> {
    const body = {
      customer: params.customer,
      billingType: params.billingType,
      value: params.value,
      dueDate: params.dueDate,
      description: params.description,
      externalReference: params.externalReference,
    };

    const response = await this.request<{
      id: string;
      customer: string;
      value: number;
      status: string;
      invoiceUrl: string;
      externalReference: string | null;
    }>('POST', '/v3/payments', body);

    return new AsaasPayment(
      response.id,
      response.customer,
      response.value,
      response.status,
      response.invoiceUrl,
      response.externalReference,
    );
  }

  public async deletePayment(asaasPaymentId: string): Promise<void> {
    await this.request<unknown>('DELETE', `/v3/payments/${asaasPaymentId}`);
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

      throw new AsaasApiException(errorDetails);
    }

    if (method === 'DELETE') {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
