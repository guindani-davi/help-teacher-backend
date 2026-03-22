import { forwardRef, Module } from '@nestjs/common';
import { AsaasModule } from '../asaas/asaas.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsController } from './controller/implementation/subscriptions.controller';
import { ISubscriptionsRepository } from './repository/i.subscriptions.repository';
import { SubscriptionsRepository } from './repository/implementation/subscriptions.repository';
import { ISubscriptionsService } from './service/i.subscriptions.service';
import { SubscriptionsService } from './service/implementation/subscriptions.service';

@Module({
  controllers: [SubscriptionsController],
  imports: [
    DatabaseModule,
    HelpersModule,
    forwardRef(() => AsaasModule),
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  providers: [
    {
      provide: ISubscriptionsRepository,
      useClass: SubscriptionsRepository,
    },
    {
      provide: ISubscriptionsService,
      useClass: SubscriptionsService,
    },
  ],
  exports: [ISubscriptionsService, ISubscriptionsRepository],
})
export class SubscriptionsModule {}
