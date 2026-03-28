import { Global, Module } from '@nestjs/common';
import { II18nService } from './services/i.i18n.service';
import { I18nService } from './services/implementations/i18n.service';

@Global()
@Module({
  providers: [
    {
      provide: II18nService,
      useClass: I18nService,
    },
  ],
  exports: [II18nService],
})
export class I18nModule {}
