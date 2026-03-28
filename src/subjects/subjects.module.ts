import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassTopicsModule } from '../class-topics/class-topics.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { ReportsModule } from '../reports/reports.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TopicsModule } from '../topics/topics.module';
import { SubjectsController } from './controllers/implementations/subjects.controller';
import { ISubjectsRepository } from './repositories/i.subjects.repository';
import { SubjectsRepository } from './repositories/implementations/subjects.repository';
import { ISubjectsService } from './services/i.subjects.service';
import { SubjectsService } from './services/implementations/subjects.service';

@Module({
  controllers: [SubjectsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => TopicsModule),
    forwardRef(() => ClassTopicsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: ISubjectsRepository,
      useClass: SubjectsRepository,
    },
    {
      provide: ISubjectsService,
      useClass: SubjectsService,
    },
  ],
  exports: [ISubjectsService],
})
export class SubjectsModule {}
