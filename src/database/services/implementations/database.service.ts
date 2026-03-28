import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDatabaseService } from '../i.database.service';

@Injectable()
export class DatabaseService extends IDatabaseService {
  public constructor(@Inject(ConfigService) configService: ConfigService) {
    super(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SECRET_KEY'),
    );
  }
}
