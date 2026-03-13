import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../payloads/jwt.payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
