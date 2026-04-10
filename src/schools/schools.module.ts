import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { ReportsModule } from '../reports/reports.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SchoolsController } from './controllers/implementations/schools.controller';
import { ISchoolsRepository } from './repositories/i.schools.repository';
import { SchoolsRepository } from './repositories/implementations/schools.repository';
import { ISchoolsService } from './services/i.schools.service';
import { SchoolsService } from './services/implementations/schools.service';

@Module({
  controllers: [SchoolsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => MembershipsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => RegistrationsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: ISchoolsRepository,
      useClass: SchoolsRepository,
    },
    {
      provide: ISchoolsService,
      useClass: SchoolsService,
    },
  ],
  exports: [ISchoolsService],
})
export class SchoolsModule {}
