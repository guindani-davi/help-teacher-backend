import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { HelpersModule } from '../helpers/helpers.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OrganizationInvitesController } from './controllers/implementations/organization-invites.controller';
import { UserInvitesController } from './controllers/implementations/user-invites.controller';
import { IInvitesRepository } from './repositories/i.invites.repository';
import { InvitesRepository } from './repositories/implementations/invites.repository';
import { IInvitesService } from './services/i.invites.service';
import { InvitesService } from './services/implementations/invites.service';

@Module({
  imports: [
    DatabaseModule,
    HelpersModule,
    AuthModule,
    MembershipsModule,
    OrganizationsModule,
    EmailModule,
    SubscriptionsModule,
  ],
  controllers: [OrganizationInvitesController, UserInvitesController],
  providers: [
    {
      provide: IInvitesRepository,
      useClass: InvitesRepository,
    },
    {
      provide: IInvitesService,
      useClass: InvitesService,
    },
  ],
})
export class InvitesModule {}
