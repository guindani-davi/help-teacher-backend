import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsException } from '../../../auth/exceptions/invalid-credentials.exception';
import { IAuthService } from '../../../auth/services/i.auth.service';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { CreateUserBodyDTO } from '../../dtos/create-user.dto';
import {
  GetUserByEmailParamsDTO,
  GetUserByIdParamsDTO,
} from '../../dtos/get-user.dto';
import { UpdateUserBodyDTO } from '../../dtos/update-user.dto';
import { SafeUser } from '../../models/safe-user.model';
import { User } from '../../models/user.model';
import { IUsersRepository } from '../../repositories/i.users.repository';
import { IUsersService } from '../i.users.service';

@Injectable()
export class UsersService extends IUsersService {
  private readonly SALT_ROUNDS_DEV = 4;
  private readonly SALT_ROUNDS_PROD = 14;
  private readonly configService: ConfigService;

  public constructor(
    @Inject(IUsersRepository) usersRepository: IUsersRepository,
    @Inject(ConfigService) configService: ConfigService,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => IAuthService)) authService: IAuthService,
  ) {
    super(usersRepository, helperService, authService);
    this.configService = configService;
  }

  public async createUserSafe(body: CreateUserBodyDTO): Promise<SafeUser> {
    const hashedPassword = await this.hashPassword(body.password);

    body.password = hashedPassword;

    const user = await this.usersRepository.createUser(body);

    return new SafeUser(user);
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

  public async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.updatePassword(userId, hashedPassword);
  }

  public async getMe(userId: string): Promise<SafeUser> {
    const user = await this.usersRepository.getUserById(userId);

    return new SafeUser(user);
  }

  public async updateMe(
    userId: string,
    body: UpdateUserBodyDTO,
  ): Promise<void> {
    let requiresReLogin = false;

    if (body.password) {
      const user = await this.usersRepository.getUserById(userId);

      const isCurrentPasswordValid = await this.comparePasswords(
        body.currentPassword!,
        user.hashedPassword,
      );

      if (!isCurrentPasswordValid) {
        throw new InvalidCredentialsException();
      }

      await this.updatePassword(userId, body.password);
    }

    if (body.locale) {
      await this.usersRepository.updateLocale(userId, body.locale);
      requiresReLogin = true;
    }

    if (requiresReLogin) {
      await this.authService.revokeAllUserRefreshTokens(userId);
    }
  }

  private pepperPassword(password: string): string {
    const pepper = this.configService.getOrThrow<string>('PASSWORD_PEPPER');
    return pepper + password;
  }

  public async updateAsaasCustomerId(
    userId: string,
    asaasCustomerId: string,
  ): Promise<void> {
    await this.usersRepository.updateAsaasCustomerId(userId, asaasCustomerId);
  }

  public async markTrialUsed(userId: string): Promise<void> {
    await this.usersRepository.markTrialUsed(userId);
  }
}
