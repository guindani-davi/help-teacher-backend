import { IDatabaseService } from '../../database/service/i.database.service';
import { Database } from '../../database/types';
import { IHelpersService } from '../../helpers/service/i.helpers.service';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import { User } from '../model/user.model';

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
  protected abstract mapToEntity(
    data: Database['public']['Tables']['users']['Row'],
  ): User;
}
