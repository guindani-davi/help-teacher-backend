import { Injectable } from '@nestjs/common';
import { IDatabaseService } from '../../database/services/i.database.service';
import { StorageBucket } from '../enums/storage-bucket.enum';

@Injectable()
export abstract class IStorageService {
  protected readonly databaseService: IDatabaseService;

  public constructor(databaseService: IDatabaseService) {
    this.databaseService = databaseService;
  }

  public abstract upload(
    bucket: StorageBucket,
    path: string,
    file: Buffer,
    contentType: string,
  ): Promise<string>;

  public abstract getPublicUrl(bucket: StorageBucket, path: string): string;

  public abstract download(
    bucket: StorageBucket,
    path: string,
  ): Promise<Buffer | null>;

  public abstract delete(bucket: StorageBucket, path: string): Promise<void>;

  public abstract deleteByPrefix(
    bucket: StorageBucket,
    prefix: string,
  ): Promise<void>;
}
