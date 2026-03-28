import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { LocaleEnum } from '../../i18n/enums/locale.enum';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import { User } from '../models/user.model';

export abstract class IUsersRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract createUser(body: CreateUserBodyDTO): Promise<User>;
  public abstract getUserById(id: string): Promise<User>;
  public abstract getUserByEmail(email: string): Promise<User>;
  public abstract updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void>;
  public abstract updateAsaasCustomerId(
    userId: string,
    asaasCustomerId: string,
  ): Promise<void>;
  public abstract updateLocale(
    userId: string,
    locale: LocaleEnum,
  ): Promise<void>;
}
