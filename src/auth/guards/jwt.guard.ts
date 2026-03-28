import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../models/jwt.model';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;
  private readonly reflector: Reflector;

  public constructor(
    @Inject(JwtService) jwtService: JwtService,
    @Inject(ConfigService) configService: ConfigService,
    @Inject(Reflector) reflector: Reflector,
  ) {
    this.jwtService = jwtService;
    this.configService = configService;
    this.reflector = reflector;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        message: 'Authentication is required to access this resource',
        messageKey: 'errors.authRequired',
      });
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
        issuer: 'help-teacher',
        audience: 'help-teacher-api',
      });

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException({
        message: 'Authentication token is invalid or expired',
        messageKey: 'errors.authInvalidToken',
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
