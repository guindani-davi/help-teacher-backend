import { Injectable } from '@nestjs/common';
import { IAuthService } from '../../auth/services/i.auth.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import {
  GetUserByEmailParamsDTO,
  GetUserByIdParamsDTO,
} from '../dtos/get-user.dto';
import { UpdateUserBodyDTO } from '../dtos/update-user.dto';
import { SafeUser } from '../models/safe-user.model';
import { User } from '../models/user.model';
import { IUsersRepository } from '../repositories/i.users.repository';

@Injectable()
export abstract class IUsersService {
  protected readonly usersRepository: IUsersRepository;
  protected readonly helperService: IHelpersService;
  protected readonly authService: IAuthService;

  public constructor(
    usersRepository: IUsersRepository,
    helperService: IHelpersService,
    authService: IAuthService,
  ) {
    this.usersRepository = usersRepository;
    this.helperService = helperService;
    this.authService = authService;
  }

  public abstract createUserSafe(body: CreateUserBodyDTO): Promise<SafeUser>;
  public abstract getMe(userId: string): Promise<SafeUser>;
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
  ): Promise<void>;
  public abstract updateAsaasCustomerId(
    userId: string,
    asaasCustomerId: string,
  ): Promise<void>;
  public abstract markTrialUsed(userId: string): Promise<void>;
}
