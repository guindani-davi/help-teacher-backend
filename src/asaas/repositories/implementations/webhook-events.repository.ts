import { Inject, Injectable } from '@nestjs/common';
import { Database } from 'src/database/types';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { WebhookEvent } from '../../models/webhook-event.model';
import { IWebhookEventsRepository } from '../i.webhook-events.repository';

@Injectable()
export class WebhookEventsRepository extends IWebhookEventsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async existsByEventId(eventId: string): Promise<boolean> {
    const result = await this.databaseService
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    return !!result.data;
  }

  public async create(
    eventId: string,
    eventType: string,
  ): Promise<WebhookEvent> {
    const result = await this.databaseService
      .from('webhook_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
      })
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  private mapToEntity(
    data: Database['public']['Tables']['webhook_events']['Row'],
  ): WebhookEvent {
    const processedAtDate = this.helperService.parseDate(data.processed_at);

    return new WebhookEvent(
      data.id,
      data.event_id,
      data.event_type,
      processedAtDate,
    );
  }
}
