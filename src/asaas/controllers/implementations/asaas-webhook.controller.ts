import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../auth/decorators/public.decorator';
import { AsaasWebhookEventDTO } from '../../dtos/asaas-webhook-event.dto';
import { IAsaasWebhookService } from '../../services/i.asaas-webhook.service';
import { IAsaasWebhookController } from '../i.asaas-webhook.controller';

@Controller('asaas')
@Public()
@SkipThrottle()
export class AsaasWebhookController extends IAsaasWebhookController {
  public constructor(
    @Inject(IAsaasWebhookService)
    asaasWebhookService: IAsaasWebhookService,
  ) {
    super(asaasWebhookService);
  }

  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  public async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: AsaasWebhookEventDTO,
  ): Promise<void> {
    await this.asaasWebhookService.handleWebhook(
      headers['asaas-access-token'],
      body,
    );
  }
}
