export interface CreateCheckoutSessionParams {
  planName: string;
  valueCents: number;
  billingCycle: string;
  externalReference: string;
}

export interface AsaasCheckoutSession {
  url: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  status: string;
  value: number;
  cycle: string;
  externalReference: string;
}

export interface UpdateAsaasSubscriptionParams {
  value?: number;
  cycle?: string;
  updatePendingPayments?: boolean;
}
