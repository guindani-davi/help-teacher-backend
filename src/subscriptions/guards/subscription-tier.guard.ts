import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '../../auth/models/jwt.model';
import type { Membership } from '../../memberships/models/membership.model';
import { ALLOWED_TIERS_KEY } from '../decorators/allowed-tiers.decorator';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';
import { InsufficientSubscriptionException } from '../exceptions/insufficient-subscription.exception';
import { ISubscriptionsService } from '../services/i.subscriptions.service';

@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  private readonly reflector: Reflector;
  private readonly subscriptionsService: ISubscriptionsService;

  public constructor(
    @Inject(Reflector) reflector: Reflector,
    @Inject(ISubscriptionsService) subscriptionsService: ISubscriptionsService,
  ) {
    this.reflector = reflector;
    this.subscriptionsService = subscriptionsService;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedTiers = this.reflector.getAllAndOverride<
      SubscriptionTierEnum[] | undefined
    >(ALLOWED_TIERS_KEY, [context.getHandler(), context.getClass()]);

    if (!allowedTiers) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as JwtPayload;

    if (!user) {
      throw new InsufficientSubscriptionException('pro');
    }

    const effectiveTier = await this.resolveEffectiveTier(request, user);

    if (!effectiveTier || !allowedTiers.includes(effectiveTier)) {
      throw new InsufficientSubscriptionException(
        allowedTiers[allowedTiers.length - 1] ?? 'pro',
      );
    }

    return true;
  }

  private async resolveEffectiveTier(
    request: any,
    user: JwtPayload,
  ): Promise<SubscriptionTierEnum | null> {
    const membership = request.membership as Membership | undefined;

    if (membership) {
      return this.subscriptionsService.getOrganizationOwnerTier(
        membership.organizationId,
      );
    }

    return this.subscriptionsService.getUserTier(user.sub);
  }
}
