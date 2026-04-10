import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AsaasWebhookController } from './controllers/implementations/asaas-webhook.controller';
import { IWebhookEventsRepository } from './repositories/i.webhook-events.repository';
import { WebhookEventsRepository } from './repositories/implementations/webhook-events.repository';
import { IAsaasWebhookService } from './services/i.asaas-webhook.service';
import { IAsaasService } from './services/i.asaas.service';
import { AsaasWebhookService } from './services/implementations/asaas-webhook.service';
import { AsaasService } from './services/implementations/asaas.service';

@Module({
  controllers: [AsaasWebhookController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [
    {
      provide: IAsaasService,
      useClass: AsaasService,
    },
    {
      provide: IWebhookEventsRepository,
      useClass: WebhookEventsRepository,
    },
    {
      provide: IAsaasWebhookService,
      useClass: AsaasWebhookService,
    },
  ],
  exports: [IAsaasService, IWebhookEventsRepository],
})
export class AsaasModule {}
