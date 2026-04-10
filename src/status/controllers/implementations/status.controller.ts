import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../auth/decorators/public.decorator';
import { StatusResponse } from '../../models/status-response.model';
import { IStatusService } from '../../services/i.status.service';
import { IStatusController } from '../i.status.controller';

@Controller('status')
@Public()
@SkipThrottle()
export class StatusController extends IStatusController {
  public constructor(@Inject(IStatusService) statusService: IStatusService) {
    super(statusService);
  }

  @Get()
  public async getStatus(): Promise<StatusResponse> {
    return await this.statusService.getStatus();
  }
}
