import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { UsersController } from './controller/implementation/users.controller';
import { IUsersRepository } from './repository/i.users.repository';
import { UsersRepository } from './repository/implementation/users.repository';
import { IUsersService } from './service/i.users.service';
import { UsersService } from './service/implementation/users.service';

@Module({
  controllers: [UsersController],
  imports: [DatabaseModule, HelpersModule, forwardRef(() => AuthModule)],
  providers: [
    {
      provide: IUsersRepository,
      useClass: UsersRepository,
    },
    {
      provide: IUsersService,
      useClass: UsersService,
    },
  ],
  exports: [IUsersService, IUsersRepository],
})
export class UsersModule {}
