import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { REQUIRED_TIER_KEY } from '../../decorators/required-tier.decorator';
import {
  SubscriptionTierEnum,
  TIER_HIERARCHY,
} from '../../enums/subscription-tier.enum';
import { ISubscriptionsService } from '../../service/i.subscriptions.service';

@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  private static readonly WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

  private readonly reflector: Reflector;
  private readonly subscriptionsService: ISubscriptionsService;

  public constructor(
    @Inject(Reflector) reflector: Reflector,
    @Inject(ISubscriptionsService)
    subscriptionsService: ISubscriptionsService,
  ) {
    this.reflector = reflector;
    this.subscriptionsService = subscriptionsService;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.get<SubscriptionTierEnum | undefined>(
      REQUIRED_TIER_KEY,
      context.getHandler(),
    );

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Insufficient subscription tier');
    }

    const userTier = user.subscriptionTier ?? SubscriptionTierEnum.FREE;

    if (
      SubscriptionTierGuard.WRITE_METHODS.includes(request.method.toUpperCase())
    ) {
      const currentTier = await this.subscriptionsService.getUserTier(user.sub);

      if (TIER_HIERARCHY[currentTier] < TIER_HIERARCHY[requiredTier]) {
        throw new ForbiddenException('Insufficient subscription tier');
      }

      return true;
    }

    if (TIER_HIERARCHY[userTier] < TIER_HIERARCHY[requiredTier]) {
      throw new ForbiddenException('Insufficient subscription tier');
    }

    return true;
  }
}
