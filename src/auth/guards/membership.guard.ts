import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IMembershipsService } from '../../memberships/services/i.memberships.service';
import type { JwtPayload } from '../models/jwt.model';

@Injectable()
export class MembershipGuard implements CanActivate {
  private readonly membershipsService: IMembershipsService;

  public constructor(
    @Inject(IMembershipsService)
    membershipsService: IMembershipsService,
  ) {
    this.membershipsService = membershipsService;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;
    const slug: string | undefined = request.params.slug;

    if (!user || !slug) {
      throw new ForbiddenException({
        message: 'You are not a member of this organization',
        messageKey: 'errors.notOrgMember',
      });
    }

    try {
      const membership = await this.membershipsService.getMembershipBySlug(
        slug,
        user,
      );

      request.membership = membership;
      return true;
    } catch {
      throw new ForbiddenException({
        message: 'You are not a member of this organization',
        messageKey: 'errors.notOrgMember',
      });
    }
  }
}
