import { AsaasWebhookEventDTO } from '../dtos/asaas-webhook-event.dto';
import { IAsaasWebhookService } from '../services/i.asaas-webhook.service';

export abstract class IAsaasWebhookController {
  protected readonly asaasWebhookService: IAsaasWebhookService;

  public constructor(asaasWebhookService: IAsaasWebhookService) {
    this.asaasWebhookService = asaasWebhookService;
  }

  public abstract handleWebhook(
    headers: Record<string, string>,
    body: AsaasWebhookEventDTO,
  ): Promise<void>;
}
