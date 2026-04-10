import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AsaasModule } from './asaas/asaas.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/jwt.guard';
import { ClassTopicsModule } from './class-topics/class-topics.module';
import { ClassesModule } from './classes/classes.module';
import { DatabaseModule } from './database/database.module';
import { EducationLevelsModule } from './education-levels/education-levels.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { HelpersModule } from './helpers/helpers.module';
import { I18nModule } from './i18n/i18n.module';
import { InvitesModule } from './invites/invites.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulesModule } from './schedules/schedules.module';
import { SchoolsModule } from './schools/schools.module';
import { StatusModule } from './status/status.module';
import { StudentUsersModule } from './student-users/student-users.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TopicsModule } from './topics/topics.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 20 }],
    }),
    DatabaseModule,
    I18nModule,
    UsersModule,
    HelpersModule,
    AuthModule,
    OrganizationsModule,
    MembershipsModule,
    InvitesModule,
    AsaasModule,
    SubscriptionsModule,
    EducationLevelsModule,
    GradeLevelsModule,
    SchoolsModule,
    StudentUsersModule,
    StudentsModule,
    RegistrationsModule,
    SchedulesModule,
    ClassesModule,
    ClassTopicsModule,
    TopicsModule,
    SubjectsModule,
    ReportsModule,
    StatusModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
