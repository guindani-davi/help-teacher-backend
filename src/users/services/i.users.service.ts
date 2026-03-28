import { Injectable } from '@nestjs/common';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import {
  GetUserByEmailParamsDTO,
  GetUserByIdParamsDTO,
} from '../dtos/get-user.dto';
import { UpdateUserBodyDTO } from '../dtos/update-user.dto';
import { User } from '../models/user.model';
import { IUsersRepository } from '../repositories/i.users.repository';

@Injectable()
export abstract class IUsersService {
  protected readonly usersRepository: IUsersRepository;
  protected readonly helperService: IHelpersService;

  public constructor(
    usersRepository: IUsersRepository,
    helperService: IHelpersService,
  ) {
    this.usersRepository = usersRepository;
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
  public abstract updateMe(
    userId: string,
    body: UpdateUserBodyDTO,
  ): Promise<{ requiresReLogin: boolean }>;
  public abstract updateAsaasCustomerId(
    userId: string,
    asaasCustomerId: string,
  ): Promise<void>;
}
