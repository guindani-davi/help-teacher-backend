import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Membership } from '../../memberships/models/membership.model';
import { SubscriptionRequiredException } from '../exceptions/subscription-required.exception';
import { ISubscriptionsService } from '../services/i.subscriptions.service';

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  private readonly logger: Logger;
  private readonly subscriptionsService: ISubscriptionsService;

  public constructor(
    @Inject(ISubscriptionsService)
    subscriptionsService: ISubscriptionsService,
  ) {
    this.logger = new Logger(ActiveSubscriptionGuard.name);
    this.subscriptionsService = subscriptionsService;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const membership = (request as any).membership as Membership | undefined;

    if (!membership) {
      this.logger.error(
        'ActiveSubscriptionGuard requires MembershipGuard to run before it. ' +
          `No membership found on ${request.method} ${request.url}`,
      );
      throw new InternalServerErrorException();
    }

    const tier = await this.subscriptionsService.getOrganizationOwnerTier(
      membership.organizationId,
    );

    if (tier === null) {
      throw new SubscriptionRequiredException();
    }

    return true;
  }
}
