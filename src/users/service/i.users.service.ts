import { ConfigService } from '@nestjs/config';
import { IHelpersService } from '../../helpers/service/i.helpers.service';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import {
  GetUserByEmailParamsDTO,
  GetUserByIdParamsDTO,
} from '../dtos/get-user.dto';
import { User } from '../model/user.model';
import { IUsersRepository } from '../repository/i.users.repository';

export abstract class IUsersService {
  protected readonly usersRepository: IUsersRepository;
  protected readonly configService: ConfigService;
  protected readonly helperService: IHelpersService;

  public constructor(
    usersRepository: IUsersRepository,
    configService: ConfigService,
    helperService: IHelpersService,
  ) {
    this.usersRepository = usersRepository;
    this.configService = configService;
    this.helperService = helperService;
  }

  public abstract createUser(body: CreateUserBodyDTO): Promise<User>;
  public abstract getUserById(params: GetUserByIdParamsDTO): Promise<User>;
  public abstract getUserByEmail(
    params: GetUserByEmailParamsDTO,
  ): Promise<User>;
  public abstract hashPassword(password: string): Promise<string>;
  public abstract comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  public abstract updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<void>;
  protected abstract pepperPassword(password: string): string;
}
