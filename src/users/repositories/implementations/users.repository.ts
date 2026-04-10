import { Inject, Injectable } from '@nestjs/common';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PostgresErrorCode } from '../../../database/enums/postgres-error-code.enum';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { LocaleEnum } from '../../../i18n/enums/locale.enum';
import { CreateUserBodyDTO } from '../../dtos/create-user.dto';
import { User } from '../../models/user.model';
import { IUsersRepository } from '../i.users.repository';

@Injectable()
export class UsersRepository extends IUsersRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async createUser(body: CreateUserBodyDTO): Promise<User> {
    const createdUser = await this.databaseService
      .from('users')
      .insert({
        email: body.email,
        hashed_password: body.password,
        name: body.name,
        surname: body.surname,
        locale: body.locale,
      })
      .select()
      .single();

    if (createdUser.error) {
      if (createdUser.error.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new EntityAlreadyExistsException('User');
      }

      throw new DatabaseException();
    }

    return this.mapToEntity(createdUser.data);
  }

  public async getUserById(id: string): Promise<User> {
    const returnedUser = await this.databaseService
      .from('users')
      .select()
      .eq('id', id)
      .single();

    if (!returnedUser.data) {
      throw new EntityNotFoundException('User');
    }

    return this.mapToEntity(returnedUser.data);
  }

  public async getUserByEmail(email: string): Promise<User> {
    const returnedUser = await this.databaseService
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (returnedUser.error || !returnedUser.data) {
      throw new EntityNotFoundException('User');
    }

    return this.mapToEntity(returnedUser.data);
  }

  public async updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    const result = await this.databaseService
      .from('users')
      .update({ hashed_password: hashedPassword })
      .eq('id', userId);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async updateAsaasCustomerId(
    userId: string,
    asaasCustomerId: string,
  ): Promise<void> {
    const result = await this.databaseService
      .from('users')
      .update({
        asaas_customer_id: asaasCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async updateLocale(userId: string, locale: LocaleEnum): Promise<void> {
    const result = await this.databaseService
      .from('users')
      .update({
        locale,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async markTrialUsed(userId: string): Promise<void> {
    const result = await this.databaseService
      .from('users')
      .update({
        has_used_trial: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  private mapToEntity(
    data: Database['public']['Tables']['users']['Row'],
  ): User {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new User(
      data.id,
      data.email,
      data.name,
      data.surname,
      data.hashed_password,
      data.asaas_customer_id,
      data.has_used_trial,
      data.locale as LocaleEnum,
      createdAtDate,
      updatedAtDate,
    );
  }
}
