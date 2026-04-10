import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IStorageService } from './services/i.storage.service';
import { StorageService } from './services/implementations/storage.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: IStorageService,
      useClass: StorageService,
    },
  ],
  exports: [IStorageService],
})
export class StorageModule {}
