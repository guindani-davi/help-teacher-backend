import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassTopicsModule } from '../class-topics/class-topics.module';
import { ClassesModule } from '../classes/classes.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { ReportsModule } from '../reports/reports.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SchedulesController } from './controllers/implementations/schedules.controller';
import { ISchedulesRepository } from './repositories/i.schedules.repository';
import { SchedulesRepository } from './repositories/implementations/schedules.repository';
import { ISchedulesService } from './services/i.schedules.service';
import { SchedulesService } from './services/implementations/schedules.service';

@Module({
  controllers: [SchedulesController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ClassesModule),
    forwardRef(() => ClassTopicsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: ISchedulesRepository,
      useClass: SchedulesRepository,
    },
    {
      provide: ISchedulesService,
      useClass: SchedulesService,
    },
  ],
  exports: [ISchedulesService],
})
export class SchedulesModule {}
