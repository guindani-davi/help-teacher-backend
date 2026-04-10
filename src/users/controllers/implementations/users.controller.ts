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
import { CreateUserBodyDTO } from '../../dtos/create-user.dto';
import { UpdateUserBodyDTO } from '../../dtos/update-user.dto';
import { SafeUser } from '../../models/safe-user.model';
import { IUsersService } from '../../services/i.users.service';
import { IUsersController } from '../i.users.controller';

@Controller('users')
export class UsersController extends IUsersController {
  public constructor(@Inject(IUsersService) userService: IUsersService) {
    super(userService);
  }

  @Post()
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  public async createUser(@Body() body: CreateUserBodyDTO): Promise<SafeUser> {
    return this.userService.createUserSafe(body);
  }

  @Get('me')
  public async getMe(@CurrentUser() user: JwtPayload): Promise<SafeUser> {
    return this.userService.getMe(user.sub);
  }

  @Patch('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateUserBodyDTO,
  ): Promise<void> {
    await this.userService.updateMe(user.sub, body);
  }
}
