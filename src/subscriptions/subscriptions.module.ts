import { forwardRef, Module } from '@nestjs/common';
import { AsaasModule } from '../asaas/asaas.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HelpersModule } from '../helpers/helpers.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsController } from './controllers/implementations/subscriptions.controller';
import { ISubscriptionsRepository } from './repositories/i.subscriptions.repository';
import { SubscriptionsRepository } from './repositories/implementations/subscriptions.repository';
import { ISubscriptionsService } from './services/i.subscriptions.service';
import { SubscriptionsService } from './services/implementations/subscriptions.service';

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
  exports: [ISubscriptionsService],
})
export class SubscriptionsModule {}
