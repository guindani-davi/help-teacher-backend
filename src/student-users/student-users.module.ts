import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { StudentsModule } from '../students/students.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StudentUsersController } from './controllers/implementations/student-users.controller';
import { IStudentUsersRepository } from './repositories/i.student-users.repository';
import { StudentUsersRepository } from './repositories/implementations/student-users.repository';
import { IStudentUsersService } from './services/i.student-users.service';
import { StudentUsersService } from './services/implementations/student-users.service';

@Module({
  controllers: [StudentUsersController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => StudentsModule),
    forwardRef(() => MembershipsModule),
  ],
  providers: [
    {
      provide: IStudentUsersRepository,
      useClass: StudentUsersRepository,
    },
    {
      provide: IStudentUsersService,
      useClass: StudentUsersService,
    },
  ],
  exports: [IStudentUsersService],
})
export class StudentUsersModule {}
