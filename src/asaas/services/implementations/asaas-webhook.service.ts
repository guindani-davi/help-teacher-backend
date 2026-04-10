import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { ISubscriptionsService } from '../../../subscriptions/services/i.subscriptions.service';
import { AsaasWebhookEventDTO } from '../../dtos/asaas-webhook-event.dto';
import { IWebhookEventsRepository } from '../../repositories/i.webhook-events.repository';
import { IAsaasWebhookService } from '../i.asaas-webhook.service';

@Injectable()
export class AsaasWebhookService extends IAsaasWebhookService {
  private readonly webhookToken: string;

  public constructor(
    @Inject(IWebhookEventsRepository)
    webhookEventsRepository: IWebhookEventsRepository,
    @Inject(ISubscriptionsService)
    subscriptionsService: ISubscriptionsService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    super(webhookEventsRepository, subscriptionsService);
    this.webhookToken = configService.getOrThrow<string>('ASAAS_WEBHOOK_TOKEN');
  }

  public async handleWebhook(
    accessToken: string | undefined,
    body: AsaasWebhookEventDTO,
  ): Promise<void> {
    this.validateToken(accessToken);

    const event = body.event;
    const eventId = body.id;

    if (!event) {
      return;
    }

    if (eventId) {
      const alreadyProcessed =
        await this.webhookEventsRepository.existsByEventId(eventId);

      if (alreadyProcessed) {
        return;
      }
    }

    await this.subscriptionsService.handleWebhookEvent(event, body);

    if (eventId) {
      await this.webhookEventsRepository.create(eventId, event);
    }
  }

  private validateToken(accessToken: string | undefined): void {
    if (
      !accessToken ||
      !timingSafeEqual(Buffer.from(accessToken), Buffer.from(this.webhookToken))
    ) {
      throw new UnauthorizedException();
    }
  }
}
