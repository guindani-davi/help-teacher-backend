import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { IAuthService } from '../../../auth/services/i.auth.service';
import { CreateUserBodyDTO } from '../../dtos/create-user.dto';
import { UpdateUserBodyDTO } from '../../dtos/update-user.dto';
import { User } from '../../models/user.model';
import { IUsersService } from '../../services/i.users.service';
import { IUsersController } from '../i.users.controller';

@Controller('users')
export class UsersController extends IUsersController {
  public constructor(
    @Inject(IUsersService) userService: IUsersService,
    @Inject(IAuthService) authService: IAuthService,
  ) {
    super(userService, authService);
  }

  @Post()
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  public async createUser(
    @Body() body: CreateUserBodyDTO,
  ): Promise<Omit<User, 'hashedPassword' | 'asaasCustomerId'>> {
    const createdUser = await this.userService.createUser(body);
    const { hashedPassword, asaasCustomerId, ...userWithoutSensitive } =
      createdUser;
    return userWithoutSensitive;
  }

  @Get('me')
  public async getMe(
    @CurrentUser() user: JwtPayload,
  ): Promise<Omit<User, 'hashedPassword' | 'asaasCustomerId'>> {
    const fullUser = await this.userService.getUserById({ id: user.sub });
    const { hashedPassword, asaasCustomerId, ...userWithoutSensitive } =
      fullUser;
    return userWithoutSensitive;
  }

  @Patch('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateUserBodyDTO,
  ): Promise<void> {
    const result = await this.userService.updateMe(user.sub, body);

    if (result.requiresReLogin) {
      await this.authService.revokeAllUserRefreshTokens(user.sub);
    }
  }
}
