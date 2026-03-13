import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Membership } from '../../organizations/model/membership.model';

export const CurrentMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Membership => {
    const request = ctx.switchToHttp().getRequest();
    return request.membership as Membership;
  },
);
