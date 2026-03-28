import { Inject, Injectable } from '@nestjs/common';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { StorageBucket } from '../../enums/storage-bucket.enum';
import { IStorageService } from '../i.storage.service';

@Injectable()
export class StorageService extends IStorageService {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
  ) {
    super(databaseService);
  }

  public async upload(
    bucket: StorageBucket,
    path: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const result = await this.databaseService.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (result.error) {
      throw new DatabaseException();
    }

    return result.data.path;
  }

  public getPublicUrl(bucket: StorageBucket, path: string): string {
    const result = this.databaseService.storage.from(bucket).getPublicUrl(path);

    return result.data.publicUrl;
  }

  public async download(
    bucket: StorageBucket,
    path: string,
  ): Promise<Buffer | null> {
    const result = await this.databaseService.storage
      .from(bucket)
      .download(path);

    if (result.error) {
      return null;
    }

    const arrayBuffer = await result.data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  public async delete(bucket: StorageBucket, path: string): Promise<void> {
    const result = await this.databaseService.storage
      .from(bucket)
      .remove([path]);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async deleteByPrefix(
    bucket: StorageBucket,
    prefix: string,
  ): Promise<void> {
    const listResult = await this.databaseService.storage
      .from(bucket)
      .list(prefix);

    if (listResult.error || !listResult.data?.length) {
      return;
    }

    const files: string[] = [];
    const folders: string[] = [];

    for (const item of listResult.data) {
      const fullPath = `${prefix}/${item.name}`;

      if (item.id) {
        files.push(fullPath);
      } else {
        folders.push(fullPath);
      }
    }

    for (const folder of folders) {
      await this.deleteByPrefix(bucket, folder);
    }

    if (files.length > 0) {
      const removeResult = await this.databaseService.storage
        .from(bucket)
        .remove(files);

      if (removeResult.error) {
        throw new DatabaseException();
      }
    }
  }
}
