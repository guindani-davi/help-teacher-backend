import { ISubscriptionsService } from '../../subscriptions/services/i.subscriptions.service';
import { AsaasWebhookEventDTO } from '../dtos/asaas-webhook-event.dto';
import { IWebhookEventsRepository } from '../repositories/i.webhook-events.repository';

export abstract class IAsaasWebhookController {
  protected readonly webhookEventsRepository: IWebhookEventsRepository;
  protected readonly subscriptionsService: ISubscriptionsService;

  public constructor(
    webhookEventsRepository: IWebhookEventsRepository,
    subscriptionsService: ISubscriptionsService,
  ) {
    this.webhookEventsRepository = webhookEventsRepository;
    this.subscriptionsService = subscriptionsService;
  }

  public abstract handleWebhook(
    headers: Record<string, string>,
    body: AsaasWebhookEventDTO,
  ): Promise<void>;
}
