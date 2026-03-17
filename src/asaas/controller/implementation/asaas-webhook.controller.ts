import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { ISubscriptionsService } from '../../../subscriptions/service/i.subscriptions.service';
import { IWebhookEventsRepository } from '../../repository/i.webhook-events.repository';
import { IAsaasWebhookController } from '../i.asaas-webhook.controller';

@Controller('asaas')
@SkipThrottle()
export class AsaasWebhookController extends IAsaasWebhookController {
  private static readonly MAX_EVENT_AGE_MS = 10 * 60 * 1000;

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

  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  public async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ): Promise<void> {
    const accessToken = headers['asaas-access-token'];

    if (accessToken !== this.webhookToken) {
      throw new UnauthorizedException();
    }

    const eventId = body.id as string | undefined;
    const event = body.event as string | undefined;

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

    const dateCreated = body.dateCreated as string | undefined;

    if (dateCreated) {
      const eventDate = new Date(dateCreated);
      const now = new Date();
      const ageMs = now.getTime() - eventDate.getTime();

      if (ageMs > AsaasWebhookController.MAX_EVENT_AGE_MS) {
        return;
      }
    }

    await this.subscriptionsService.handleWebhookEvent(event, body);

    if (eventId) {
      await this.webhookEventsRepository.create(eventId, event);
    }
  }
}
