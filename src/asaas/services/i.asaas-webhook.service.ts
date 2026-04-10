import { Injectable } from '@nestjs/common';
import { ISubscriptionsService } from '../../subscriptions/services/i.subscriptions.service';
import { AsaasWebhookEventDTO } from '../dtos/asaas-webhook-event.dto';
import { IWebhookEventsRepository } from '../repositories/i.webhook-events.repository';

@Injectable()
export abstract class IAsaasWebhookService {
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
    accessToken: string | undefined,
    body: AsaasWebhookEventDTO,
  ): Promise<void>;
}
