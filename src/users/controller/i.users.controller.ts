import type { JwtPayload } from '../../auth/payloads/jwt.payload';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
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
  public abstract getMe(
    user: JwtPayload,
  ): Promise<Omit<User, 'hashedPassword'>>;
}
