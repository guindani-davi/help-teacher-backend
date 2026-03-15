import { ISubscriptionsService } from '../../subscriptions/service/i.subscriptions.service';
import { IWebhookEventsRepository } from '../repository/i.webhook-events.repository';

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
    body: any,
  ): Promise<void>;
}
