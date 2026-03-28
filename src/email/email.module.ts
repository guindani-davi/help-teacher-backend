import { Module } from '@nestjs/common';
import { HelpersModule } from '../helpers/helpers.module';
import { IEmailService } from './services/i.email.service';
import { EmailService } from './services/implementations/email.service';

@Module({
  imports: [HelpersModule],
  providers: [
    {
      provide: IEmailService,
      useClass: EmailService,
    },
  ],
  exports: [IEmailService],
})
export class EmailModule {}
