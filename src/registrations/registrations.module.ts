import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { GradeLevelsModule } from '../grade-levels/grade-levels.module';
import { HelpersModule } from '../helpers/helpers.module';
import { ReportsModule } from '../reports/reports.module';
import { SchoolsModule } from '../schools/schools.module';
import { StudentsModule } from '../students/students.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { RegistrationsController } from './controllers/implementations/registrations.controller';
import { IRegistrationsRepository } from './repositories/i.registrations.repository';
import { RegistrationsRepository } from './repositories/implementations/registrations.repository';
import { IRegistrationsService } from './services/i.registrations.service';
import { RegistrationsService } from './services/implementations/registrations.service';

@Module({
  controllers: [RegistrationsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => StudentsModule),
    forwardRef(() => SchoolsModule),
    forwardRef(() => GradeLevelsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: IRegistrationsRepository,
      useClass: RegistrationsRepository,
    },
    {
      provide: IRegistrationsService,
      useClass: RegistrationsService,
    },
  ],
  exports: [IRegistrationsService],
})
export class RegistrationsModule {}
