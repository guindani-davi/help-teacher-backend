import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeEnvironment } from '../../enums/environment.enum';
import { IHelpersService } from '../i.helpers.service';

@Injectable()
export class HelpersService extends IHelpersService {
  public constructor(@Inject(ConfigService) configService: ConfigService) {
    super(configService);
  }

  public parseEntitiesDates(
    createdAt: string,
    updatedAt: string | null,
  ): { createdAtDate: Date; updatedAtDate: Date | null } {
    const createdAtDate = new Date(createdAt);
    const updatedAtDate = updatedAt ? new Date(updatedAt) : null;

    return { createdAtDate, updatedAtDate };
  }

  public isProduction(): boolean {
    const nodeEnv = this.configService.getOrThrow<NodeEnvironment>('NODE_ENV');
    return nodeEnv === NodeEnvironment.PRODUCTION;
  }

  public generateSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
