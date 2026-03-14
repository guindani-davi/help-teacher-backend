import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HelpersModule } from './helpers/helpers.module';
import { InvitesModule } from './invites/invites.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    DatabaseModule,
    UsersModule,
    HelpersModule,
    AuthModule,
    OrganizationsModule,
    InvitesModule,
  ],
})
export class AppModule {}
