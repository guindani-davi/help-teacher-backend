import { ConfigService } from '@nestjs/config';

export abstract class IHelpersService {
  protected readonly configService: ConfigService;

  public constructor(configService: ConfigService) {
    this.configService = configService;
  }

  public abstract parseEntitiesDates(
    createdAt: string,
    updatedAt: string | null,
  ): { createdAtDate: Date; updatedAtDate: Date | null };
  public abstract isProduction(): boolean;
  public abstract generateSlug(name: string): string;
}
