import type { JwtPayload } from '../../auth/models/jwt.model';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import { UpdateUserBodyDTO } from '../dtos/update-user.dto';
import { SafeUser } from '../models/safe-user.model';
import { IUsersService } from '../services/i.users.service';

export abstract class IUsersController {
  protected readonly userService: IUsersService;

  public constructor(userService: IUsersService) {
    this.userService = userService;
  }

  public abstract createUser(body: CreateUserBodyDTO): Promise<SafeUser>;
  public abstract getMe(user: JwtPayload): Promise<SafeUser>;
  public abstract updateMe(
    user: JwtPayload,
    body: UpdateUserBodyDTO,
  ): Promise<void>;
}
