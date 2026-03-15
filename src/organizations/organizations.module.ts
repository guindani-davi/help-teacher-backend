import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OrganizationsController } from './controller/implementation/organizations.controller';
import { IOrganizationsRepository } from './repository/i.organizations.repository';
import { OrganizationsRepository } from './repository/implementation/organizations.repository';
import { IOrganizationsService } from './service/i.organizations.service';
import { OrganizationsService } from './service/implementation/organizations.service';

@Module({
  controllers: [OrganizationsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AuthModule),
    SubscriptionsModule,
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
