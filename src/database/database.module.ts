import { Module } from '@nestjs/common';
import { IDatabaseService } from './services/i.database.service';
import { DatabaseService } from './services/implementations/database.service';

@Module({
  exports: [IDatabaseService],
  providers: [
    {
      provide: IDatabaseService,
      useClass: DatabaseService,
    },
  ],
})
export class DatabaseModule {}
