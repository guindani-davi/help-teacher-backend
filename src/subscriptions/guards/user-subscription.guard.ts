import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { UserSubscriptionRequiredException } from '../exceptions/user-subscription-required.exception';
import { ISubscriptionsService } from '../services/i.subscriptions.service';

@Injectable()
export class UserSubscriptionGuard implements CanActivate {
  private readonly subscriptionsService: ISubscriptionsService;

  public constructor(
    @Inject(ISubscriptionsService)
    subscriptionsService: ISubscriptionsService,
  ) {
    this.subscriptionsService = subscriptionsService;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException({
        message: 'Authentication is required',
        messageKey: 'errors.authRequired',
      });
    }

    const tier = await this.subscriptionsService.getUserTier(user.sub);

    if (tier === null) {
      throw new UserSubscriptionRequiredException();
    }

    return true;
  }
}
