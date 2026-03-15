import { IDatabaseService } from '../../database/service/i.database.service';
import { Database } from '../../database/types';
import { IHelpersService } from '../../helpers/service/i.helpers.service';
import { WebhookEvent } from '../model/webhook-event.model';

export abstract class IWebhookEventsRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract existsByEventId(eventId: string): Promise<boolean>;
  public abstract create(
    eventId: string,
    eventType: string,
  ): Promise<WebhookEvent>;
  protected abstract mapToEntity(
    data: Database['public']['Tables']['webhook_events']['Row'],
  ): WebhookEvent;
}
