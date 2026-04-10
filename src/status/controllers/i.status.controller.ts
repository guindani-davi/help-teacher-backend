import { StatusResponse } from '../models/status-response.model';
import { IStatusService } from '../services/i.status.service';

export abstract class IStatusController {
  protected readonly statusService: IStatusService;

  public constructor(statusService: IStatusService) {
    this.statusService = statusService;
  }

  public abstract getStatus(): Promise<StatusResponse>;
}
