import type { JwtPayload } from '../../auth/models/jwt.model';
import type { IAuthService } from '../../auth/services/i.auth.service';
import { CreateUserBodyDTO } from '../dtos/create-user.dto';
import { UpdateUserBodyDTO } from '../dtos/update-user.dto';
import { User } from '../models/user.model';
import { IUsersService } from '../services/i.users.service';

export abstract class IUsersController {
  protected readonly userService: IUsersService;
  protected readonly authService: IAuthService;

  public constructor(userService: IUsersService, authService: IAuthService) {
    this.userService = userService;
    this.authService = authService;
  }

  public abstract createUser(
    body: CreateUserBodyDTO,
  ): Promise<Omit<User, 'hashedPassword' | 'asaasCustomerId'>>;
  public abstract getMe(
    user: JwtPayload,
  ): Promise<Omit<User, 'hashedPassword' | 'asaasCustomerId'>>;
  public abstract updateMe(
    user: JwtPayload,
    body: UpdateUserBodyDTO,
  ): Promise<void>;
}
