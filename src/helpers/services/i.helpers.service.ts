import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class IHelpersService {
  public constructor() {}

  public abstract parseEntitiesDates(
    createdAt: string,
    updatedAt: string | null,
  ): { createdAtDate: Date; updatedAtDate: Date | null };
  public abstract parseDate(date: string): Date;
  public abstract subtractOneDay(date: string): string;
  public abstract isProduction(): boolean;
  public abstract generateSlug(name: string): string;
}
