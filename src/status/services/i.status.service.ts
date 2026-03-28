import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDatabaseService } from '../../database/services/i.database.service';
import { StatusResponse } from '../models/status-response.model';

@Injectable()
export abstract class IStatusService {
  protected readonly databaseService: IDatabaseService;
  protected readonly configService: ConfigService;

  public constructor(
    databaseService: IDatabaseService,
    configService: ConfigService,
  ) {
    this.databaseService = databaseService;
    this.configService = configService;
  }

  public abstract getStatus(): Promise<StatusResponse>;
}
