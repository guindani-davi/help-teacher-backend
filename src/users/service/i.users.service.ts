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
  protected readonly SALT_ROUNDS_DEV: number;
  protected readonly SALT_ROUNDS_PROD: number;
  protected readonly usersRepository: IUsersRepository;
  protected readonly configService: ConfigService;
  protected readonly helperService: IHelpersService;

  public constructor(
    usersRepository: IUsersRepository,
    configService: ConfigService,
    helperService: IHelpersService,
  ) {
    this.SALT_ROUNDS_DEV = 4;
    this.SALT_ROUNDS_PROD = 14;
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
  protected abstract pepperPassword(password: string): string;
}
