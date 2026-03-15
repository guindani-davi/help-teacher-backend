import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IOrganizationsService } from '../../../organizations/service/i.organizations.service';
import type { JwtPayload } from '../../payloads/jwt.payload';

@Injectable()
export class MembershipGuard implements CanActivate {
  private readonly organizationsService: IOrganizationsService;

  public constructor(
    @Inject(IOrganizationsService)
    organizationsService: IOrganizationsService,
  ) {
    this.organizationsService = organizationsService;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;
    const slug: string | undefined = request.params.slug;

    if (!user || !slug) {
      throw new ForbiddenException();
    }

    try {
      const membership = await this.organizationsService.getMembership(
        { slug },
        user,
      );

      request.membership = membership;
      return true;
    } catch {
      throw new ForbiddenException();
    }
  }
}
