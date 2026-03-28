import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { GradeLevelsModule } from '../grade-levels/grade-levels.module';
import { HelpersModule } from '../helpers/helpers.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { ReportsModule } from '../reports/reports.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EducationLevelsController } from './controllers/implementations/education-levels.controller';
import { IEducationLevelsRepository } from './repositories/i.education-levels.repository';
import { EducationLevelsRepository } from './repositories/implementations/education-levels.repository';
import { IEducationLevelsService } from './services/i.education-levels.service';
import { EducationLevelsService } from './services/implementations/education-levels.service';

@Module({
  controllers: [EducationLevelsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => GradeLevelsModule),
    forwardRef(() => RegistrationsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: IEducationLevelsRepository,
      useClass: EducationLevelsRepository,
    },
    {
      provide: IEducationLevelsService,
      useClass: EducationLevelsService,
    },
  ],
  exports: [IEducationLevelsService],
})
export class EducationLevelsModule {}
