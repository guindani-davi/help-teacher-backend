import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controller/implementation/auth.controller';
import { AuthGuard } from './guards/jwt/jwt.guard';
import { MembershipGuard } from './guards/membership/membership.guard';
import { RolesGuard } from './guards/roles/roles.guard';
import { IAuthService } from './service/i.auth.service';
import { AuthService } from './service/implementation/auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    forwardRef(() => UsersModule),
    EmailModule,
    DatabaseModule,
    forwardRef(() => OrganizationsModule),
  ],
  providers: [
    {
      provide: IAuthService,
      useClass: AuthService,
    },
    AuthGuard,
    MembershipGuard,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [JwtModule, IAuthService, AuthGuard, MembershipGuard, RolesGuard],
})
export class AuthModule {}
