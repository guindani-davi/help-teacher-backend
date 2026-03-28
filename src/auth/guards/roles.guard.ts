import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Membership } from '../../memberships/models/membership.model';
import { ALLOWED_ROLES_KEY } from '../decorators/roles.decorator';
import { RolesEnum } from '../enums/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly reflector: Reflector;

  public constructor(@Inject(Reflector) reflector: Reflector) {
    this.reflector = reflector;
  }

  public canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolesEnum[]>(
      ALLOWED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const membership: Membership | undefined = request.membership;

    if (!membership) {
      throw new ForbiddenException({
        message: 'You do not have the required role to perform this action',
        messageKey: 'errors.insufficientRole',
      });
    }

    const hasRequiredRole = requiredRoles.some((requiredRole) =>
      membership.roles.includes(requiredRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException({
        message: 'You do not have the required role to perform this action',
        messageKey: 'errors.insufficientRole',
      });
    }

    return true;
  }
}
