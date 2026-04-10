import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassTopicsModule } from '../class-topics/class-topics.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ReportsModule } from '../reports/reports.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { StudentsModule } from '../students/students.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ClassesController } from './controllers/implementations/classes.controller';
import { IClassesRepository } from './repositories/i.classes.repository';
import { ClassesRepository } from './repositories/implementations/classes.repository';
import { IClassesService } from './services/i.classes.service';
import { ClassesService } from './services/implementations/classes.service';

@Module({
  controllers: [ClassesController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => SchedulesModule),
    forwardRef(() => StudentsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ClassTopicsModule),
    forwardRef(() => ReportsModule),
    forwardRef(() => MembershipsModule),
  ],
  providers: [
    {
      provide: IClassesRepository,
      useClass: ClassesRepository,
    },
    {
      provide: IClassesService,
      useClass: ClassesService,
    },
  ],
  exports: [IClassesService],
})
export class ClassesModule {}
