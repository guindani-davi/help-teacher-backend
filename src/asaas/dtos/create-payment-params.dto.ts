export class CreatePaymentParamsDTO {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
}
