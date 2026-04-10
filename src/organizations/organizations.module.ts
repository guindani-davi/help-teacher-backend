import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ReportsModule } from '../reports/reports.module';
import { StorageModule } from '../storage/storage.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OrganizationsController } from './controllers/implementations/organizations.controller';
import { IOrganizationsRepository } from './repositories/i.organizations.repository';
import { OrganizationsRepository } from './repositories/implementations/organizations.repository';
import { IOrganizationsService } from './services/i.organizations.service';
import { OrganizationsService } from './services/implementations/organizations.service';

@Module({
  controllers: [OrganizationsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    StorageModule,
    forwardRef(() => AuthModule),
    forwardRef(() => MembershipsModule),
    forwardRef(() => ReportsModule),
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [
    {
      provide: IOrganizationsRepository,
      useClass: OrganizationsRepository,
    },
    {
      provide: IOrganizationsService,
      useClass: OrganizationsService,
    },
  ],
  exports: [IOrganizationsService],
})
export class OrganizationsModule {}
