import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClassTopicsModule } from '../class-topics/class-topics.module';
import { ClassesModule } from '../classes/classes.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { ReportsModule } from '../reports/reports.module';
import { StudentUsersModule } from '../student-users/student-users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StudentsController } from './controllers/implementations/students.controller';
import { IStudentsRepository } from './repositories/i.students.repository';
import { StudentsRepository } from './repositories/implementations/students.repository';
import { IStudentsService } from './services/i.students.service';
import { StudentsService } from './services/implementations/students.service';

@Module({
  controllers: [StudentsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => StudentUsersModule),
    forwardRef(() => RegistrationsModule),
    forwardRef(() => ClassesModule),
    forwardRef(() => ClassTopicsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: IStudentsRepository,
      useClass: StudentsRepository,
    },
    {
      provide: IStudentsService,
      useClass: StudentsService,
    },
  ],
  exports: [IStudentsService],
})
export class StudentsModule {}
