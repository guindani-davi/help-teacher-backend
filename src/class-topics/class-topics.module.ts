import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassesModule } from '../classes/classes.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { ReportsModule } from '../reports/reports.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TopicsModule } from '../topics/topics.module';
import { ClassTopicsController } from './controllers/implementations/class-topics.controller';
import { IClassTopicsRepository } from './repositories/i.class-topics.repository';
import { ClassTopicsRepository } from './repositories/implementations/class-topics.repository';
import { IClassTopicsService } from './services/i.class-topics.service';
import { ClassTopicsService } from './services/implementations/class-topics.service';

@Module({
  controllers: [ClassTopicsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ClassesModule),
    forwardRef(() => TopicsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: IClassTopicsRepository,
      useClass: ClassTopicsRepository,
    },
    {
      provide: IClassTopicsService,
      useClass: ClassTopicsService,
    },
  ],
  exports: [IClassTopicsService],
})
export class ClassTopicsModule {}
