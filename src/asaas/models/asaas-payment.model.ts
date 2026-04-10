export class AsaasPayment {
  public readonly id: string;
  public readonly customer: string;
  public readonly value: number;
  public readonly status: string;
  public readonly invoiceUrl: string;
  public readonly externalReference: string | null;

  public constructor(
    id: string,
    customer: string,
    value: number,
    status: string,
    invoiceUrl: string,
    externalReference: string | null,
  ) {
    this.id = id;
    this.customer = customer;
    this.value = value;
    this.status = status;
    this.invoiceUrl = invoiceUrl;
    this.externalReference = externalReference;
  }
}
