export class CheckoutSessionResponse {
  public readonly checkoutUrl: string;
  public readonly expiresInMinutes: number;

  public constructor(checkoutUrl: string, expiresInMinutes: number) {
    this.checkoutUrl = checkoutUrl;
    this.expiresInMinutes = expiresInMinutes;
  }
}
