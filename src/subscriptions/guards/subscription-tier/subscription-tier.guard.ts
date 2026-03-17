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
import type { Membership } from '../../../organizations/model/membership.model';
import { ALLOWED_TIERS_KEY } from '../../decorators/allowed-tiers.decorator';
import { SubscriptionTierEnum } from '../../enums/subscription-tier.enum';
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
    const allowedTiers = this.reflector.getAllAndOverride<
      SubscriptionTierEnum[] | undefined
    >(ALLOWED_TIERS_KEY, [context.getHandler(), context.getClass()]);

    if (!allowedTiers) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Insufficient subscription tier');
    }

    const effectiveTier = await this.resolveEffectiveTier(request, user);

    if (!allowedTiers.includes(effectiveTier)) {
      throw new ForbiddenException('Insufficient subscription tier');
    }

    return true;
  }

  private async resolveEffectiveTier(
    request: Request,
    user: JwtPayload,
  ): Promise<SubscriptionTierEnum> {
    const membership = (request as any).membership as Membership | undefined;

    if (membership) {
      return this.subscriptionsService.getOrganizationOwnerTier(
        membership.organizationId,
      );
    }

    if (
      SubscriptionTierGuard.WRITE_METHODS.includes(request.method.toUpperCase())
    ) {
      return this.subscriptionsService.getUserTier(user.sub);
    }

    return user.subscriptionTier ?? SubscriptionTierEnum.FREE;
  }
}
