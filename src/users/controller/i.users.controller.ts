import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import {
  GetUserByEmailParamsDTO,
  GetUserByIdParamsDTO,
} from '../dtos/get-user.dto';
import { User } from '../model/user.model';
import { IUsersService } from '../service/i.users.service';

export abstract class IUsersController {
  protected readonly userService: IUsersService;

  public constructor(userService: IUsersService) {
    this.userService = userService;
  }

  public abstract createUser(
    body: CreateUserBodyDTO,
  ): Promise<Omit<User, 'hashedPassword'>>;
  public abstract getUserById(
    params: GetUserByIdParamsDTO,
  ): Promise<Omit<User, 'hashedPassword'>>;
  public abstract getUserByEmail(
    params: GetUserByEmailParamsDTO,
  ): Promise<Omit<User, 'hashedPassword'>>;
}
