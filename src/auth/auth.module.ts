import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/implementations/auth.controller';
import { AuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { IAuthService } from './services/i.auth.service';
import { AuthService } from './services/implementations/auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'JWT_DURATION',
          ) as StringValue,
          issuer: 'help-teacher',
          audience: 'help-teacher-api',
        },
      }),
    }),
    forwardRef(() => UsersModule),
    EmailModule,
    DatabaseModule,
  ],
  providers: [
    {
      provide: IAuthService,
      useClass: AuthService,
    },
    AuthGuard,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [JwtModule, IAuthService, AuthGuard, RolesGuard],
})
export class AuthModule {}
