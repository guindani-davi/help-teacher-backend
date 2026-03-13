import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HelpersModule } from '../helpers/helpers.module';
import { IHelpersService } from '../helpers/service/i.helpers.service';
import { IEmailService } from './service/i.email.service';
import { ResendEmailService } from './service/implementation/resend-email.service';
import { SmtpEmailService } from './service/implementation/smtp-email.service';

@Module({
  imports: [HelpersModule],
  providers: [
    {
      provide: IEmailService,
      useFactory: (
        configService: ConfigService,
        helpersService: IHelpersService,
      ) => {
        if (helpersService.isProduction()) {
          return new ResendEmailService(configService);
        }
        return new SmtpEmailService(configService);
      },
      inject: [ConfigService, IHelpersService],
    },
  ],
  exports: [IEmailService],
})
export class EmailModule {}
