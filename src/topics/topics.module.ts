import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassTopicsModule } from '../class-topics/class-topics.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ReportsModule } from '../reports/reports.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TopicsController } from './controllers/implementations/topics.controller';
import { ITopicsRepository } from './repositories/i.topics.repository';
import { TopicsRepository } from './repositories/implementations/topics.repository';
import { ITopicsService } from './services/i.topics.service';
import { TopicsService } from './services/implementations/topics.service';

@Module({
  controllers: [TopicsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => SubjectsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => MembershipsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ClassTopicsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: ITopicsRepository,
      useClass: TopicsRepository,
    },
    {
      provide: ITopicsService,
      useClass: TopicsService,
    },
  ],
  exports: [ITopicsService],
})
export class TopicsModule {}
