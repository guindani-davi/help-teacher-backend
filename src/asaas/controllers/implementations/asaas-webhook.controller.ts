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
import { timingSafeEqual } from 'crypto';
import { Public } from '../../../auth/decorators/public.decorator';
import { ISubscriptionsService } from '../../../subscriptions/services/i.subscriptions.service';
import { AsaasWebhookEventDTO } from '../../dtos/asaas-webhook-event.dto';
import { IWebhookEventsRepository } from '../../repositories/i.webhook-events.repository';
import { IAsaasWebhookController } from '../i.asaas-webhook.controller';

@Controller('asaas')
@Public()
@SkipThrottle()
export class AsaasWebhookController extends IAsaasWebhookController {
  private readonly webhookToken: string;
  private readonly configService: ConfigService;

  public constructor(
    @Inject(IWebhookEventsRepository)
    webhookEventsRepository: IWebhookEventsRepository,
    @Inject(ISubscriptionsService)
    subscriptionsService: ISubscriptionsService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    super(webhookEventsRepository, subscriptionsService);
    this.configService = configService;
    this.webhookToken = this.configService.getOrThrow<string>(
      'ASAAS_WEBHOOK_TOKEN',
    );
  }

  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  public async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: AsaasWebhookEventDTO,
  ): Promise<void> {
    const accessToken = headers['asaas-access-token'];

    if (
      !accessToken ||
      !timingSafeEqual(Buffer.from(accessToken), Buffer.from(this.webhookToken))
    ) {
      throw new UnauthorizedException();
    }

    const eventId = body.id;
    const event = body.event;

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
}
