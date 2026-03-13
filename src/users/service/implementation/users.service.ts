import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IHelpersService } from '../../../helpers/service/i.helpers.service';
import { CreateUserBodyDTO } from '../../dtos/create-user.dto';
import {
  GetUserByEmailParamsDTO,
  GetUserByIdParamsDTO,
} from '../../dtos/get-user.dto';
import { User } from '../../model/user.model';
import { IUsersRepository } from '../../repository/i.users.repository';
import { IUsersService } from '../i.users.service';

@Injectable()
export class UsersService extends IUsersService {
  public constructor(
    @Inject(IUsersRepository) usersRepository: IUsersRepository,
    @Inject(ConfigService) configService: ConfigService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(usersRepository, configService, helperService);
  }

  public async createUser(body: CreateUserBodyDTO): Promise<User> {
    const hashedPassword = await this.hashPassword(body.password);

    body.password = hashedPassword;

    return this.usersRepository.createUser(body);
  }

  public async getUserById(params: GetUserByIdParamsDTO): Promise<User> {
    return this.usersRepository.getUserById(params.id);
  }

  public async getUserByEmail(params: GetUserByEmailParamsDTO): Promise<User> {
    return this.usersRepository.getUserByEmail(params.email);
  }

  public async hashPassword(password: string): Promise<string> {
    const pepperedPassword = this.pepperPassword(password);

    const saltRounds = this.helperService.isProduction()
      ? this.SALT_ROUNDS_PROD
      : this.SALT_ROUNDS_DEV;

    return bcrypt.hash(pepperedPassword, saltRounds);
  }

  public async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const pepperedPassword = this.pepperPassword(plainPassword);
    return bcrypt.compare(pepperedPassword, hashedPassword);
  }

  protected pepperPassword(password: string): string {
    const pepper = this.configService.get<string>('PASSWORD_PEPPER');
    return pepper + password;
  }
}
