export interface AsaasSubscription {
  id: string;
  customer: string;
  status: string;
  value: number;
  cycle: string;
  nextDueDate: string;
  externalReference: string;
}
