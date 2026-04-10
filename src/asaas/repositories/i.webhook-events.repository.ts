import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { WebhookEvent } from '../models/webhook-event.model';

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
}
