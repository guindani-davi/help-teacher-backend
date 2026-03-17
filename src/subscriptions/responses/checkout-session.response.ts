export class CheckoutSessionResponse {
  public readonly checkoutUrl: string;

  public constructor(checkoutUrl: string) {
    this.checkoutUrl = checkoutUrl;
  }
}
