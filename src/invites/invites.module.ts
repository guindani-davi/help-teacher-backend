import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { HelpersModule } from '../helpers/helpers.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OrganizationInvitesController } from './controller/implementation/organization-invites.controller';
import { UserInvitesController } from './controller/implementation/user-invites.controller';
import { IInvitesRepository } from './repository/i.invites.repository';
import { InvitesRepository } from './repository/implementation/invites.repository';
import { IInvitesService } from './service/i.invites.service';
import { InvitesService } from './service/implementation/invites.service';

@Module({
  imports: [
    DatabaseModule,
    HelpersModule,
    AuthModule,
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
