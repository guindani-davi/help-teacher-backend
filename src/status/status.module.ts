import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StatusController } from './controllers/implementations/status.controller';
import { IStatusService } from './services/i.status.service';
import { StatusService } from './services/implementations/status.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: IStatusService,
      useClass: StatusService,
    },
  ],
  controllers: [StatusController],
})
export class StatusModule {}
