import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EducationLevelsModule } from '../education-levels/education-levels.module';
import { HelpersModule } from '../helpers/helpers.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { ReportsModule } from '../reports/reports.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GradeLevelsController } from './controllers/implementations/grade-levels.controller';
import { IGradeLevelsRepository } from './repositories/i.grade-levels.repository';
import { GradeLevelsRepository } from './repositories/implementations/grade-levels.repository';
import { IGradeLevelsService } from './services/i.grade-levels.service';
import { GradeLevelsService } from './services/implementations/grade-levels.service';

@Module({
  controllers: [GradeLevelsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => EducationLevelsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => RegistrationsModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [
    {
      provide: IGradeLevelsRepository,
      useClass: GradeLevelsRepository,
    },
    {
      provide: IGradeLevelsService,
      useClass: GradeLevelsService,
    },
  ],
  exports: [IGradeLevelsService],
})
export class GradeLevelsModule {}
