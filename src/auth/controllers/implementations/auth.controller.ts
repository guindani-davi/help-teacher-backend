import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../decorators/public.decorator';
import { LoginDTO } from '../../dtos/login.dto';
import { RefreshTokenDTO } from '../../dtos/refresh-token.dto';
import { RequestPasswordResetDTO } from '../../dtos/request-password-reset.dto';
import { ResetPasswordDTO } from '../../dtos/reset-password.dto';
import { AuthTokensResponse } from '../../models/auth-tokens-response.model';
import { IAuthService } from '../../services/i.auth.service';
import { IAuthController } from '../i.auth.controller';

@Controller('auth')
@Public()
export class AuthController extends IAuthController {
  public constructor(@Inject(IAuthService) authService: IAuthService) {
    super(authService);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  public async login(@Body() body: LoginDTO): Promise<AuthTokensResponse> {
    return await this.authService.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  public async refresh(
    @Body() body: RefreshTokenDTO,
  ): Promise<AuthTokensResponse> {
    return await this.authService.refresh(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async logout(@Body() body: RefreshTokenDTO): Promise<void> {
    await this.authService.logout(body);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  public async requestPasswordReset(
    @Body() body: RequestPasswordResetDTO,
  ): Promise<void> {
    await this.authService.requestPasswordReset(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  public async resetPassword(@Body() body: ResetPasswordDTO): Promise<void> {
    await this.authService.resetPassword(body);
  }
}
