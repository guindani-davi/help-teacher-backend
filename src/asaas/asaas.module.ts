import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AsaasWebhookController } from './controller/implementation/asaas-webhook.controller';
import { IWebhookEventsRepository } from './repository/i.webhook-events.repository';
import { WebhookEventsRepository } from './repository/implementation/webhook-events.repository';
import { IAsaasService } from './service/i.asaas.service';
import { AsaasService } from './service/implementation/asaas.service';

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
  ],
  exports: [IAsaasService, IWebhookEventsRepository],
})
export class AsaasModule {}
