import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AuthGuard } from '../../../auth/guards/jwt/jwt.guard';
import type { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { CreateUserBodyDTO } from '../../dtos/create-user.dto';
import { User } from '../../model/user.model';
import { IUsersService } from '../../service/i.users.service';
import { IUsersController } from '../i.users.controller';

@Controller('users')
export class UsersController extends IUsersController {
  public constructor(@Inject(IUsersService) userService: IUsersService) {
    super(userService);
  }

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  public async createUser(
    @Body() body: CreateUserBodyDTO,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const createdUser = await this.userService.createUser(body);
    const { hashedPassword, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }

  @UseGuards(AuthGuard)
  @Get('me')
  public async getMe(
    @CurrentUser() user: JwtPayload,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const fullUser = await this.userService.getUserById({ id: user.sub });
    const { hashedPassword, ...userWithoutPassword } = fullUser;
    return userWithoutPassword;
  }
}
