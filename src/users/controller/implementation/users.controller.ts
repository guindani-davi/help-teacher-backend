import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../auth/guards/jwt/jwt.guard';
import { CreateUserBodyDTO } from '../../dtos/create-user.dto';
import {
  GetUserByEmailParamsDTO,
  GetUserByIdParamsDTO,
} from '../../dtos/get-user.dto';
import { User } from '../../model/user.model';
import { IUsersService } from '../../service/i.users.service';
import { IUsersController } from '../i.users.controller';

@Controller('users')
export class UsersController extends IUsersController {
  public constructor(@Inject(IUsersService) userService: IUsersService) {
    super(userService);
  }

  @Post()
  public async createUser(
    @Body() body: CreateUserBodyDTO,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const createdUser = await this.userService.createUser(body);
    const { hashedPassword, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }

  @UseGuards(AuthGuard)
  @Get('id/:id')
  public async getUserById(
    @Param() params: GetUserByIdParamsDTO,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const user = await this.userService.getUserById(params);
    const { hashedPassword, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(AuthGuard)
  @Get('email/:email')
  public async getUserByEmail(
    @Param() params: GetUserByEmailParamsDTO,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const user = await this.userService.getUserByEmail(params);
    const { hashedPassword, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
