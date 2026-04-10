export class WebhookEvent {
  public readonly id: string;
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly processedAt: Date;

  public constructor(
    id: string,
    eventId: string,
    eventType: string,
    processedAt: Date,
  ) {
    this.id = id;
    this.eventId = eventId;
    this.eventType = eventType;
    this.processedAt = processedAt;
  }
}
