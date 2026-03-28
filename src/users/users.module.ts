import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { UsersController } from './controllers/implementations/users.controller';
import { IUsersRepository } from './repositories/i.users.repository';
import { UsersRepository } from './repositories/implementations/users.repository';
import { IUsersService } from './services/i.users.service';
import { UsersService } from './services/implementations/users.service';

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
  exports: [IUsersService],
})
export class UsersModule {}
