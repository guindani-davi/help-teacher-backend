import { Module } from '@nestjs/common';
import { IHelpersService } from './services/i.helpers.service';
import { HelpersService } from './services/implementations/helpers.service';

@Module({
  exports: [IHelpersService],
  providers: [
    {
      provide: IHelpersService,
      useClass: HelpersService,
    },
  ],
})
export class HelpersModule {}
