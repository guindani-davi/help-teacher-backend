import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeEnvironment } from '../../enums/environment.enum';
import { IHelpersService } from '../i.helpers.service';

@Injectable()
export class HelpersService extends IHelpersService {
  private readonly configService: ConfigService;

  public constructor(@Inject(ConfigService) configService: ConfigService) {
    super();
    this.configService = configService;
  }

  public parseEntitiesDates(
    createdAt: string,
    updatedAt: string | null,
  ): { createdAtDate: Date; updatedAtDate: Date | null } {
    const createdAtDate = this.parseDate(createdAt);
    const updatedAtDate = updatedAt ? this.parseDate(updatedAt) : null;

    return { createdAtDate, updatedAtDate };
  }

  public parseDate(date: string): Date {
    return new Date(date);
  }

  public subtractOneDay(date: string): string {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);

    return d.toISOString().split('T')[0] as string;
  }

  public getCurrentDate(): string {
    return new Date().toISOString().split('T')[0] as string;
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
