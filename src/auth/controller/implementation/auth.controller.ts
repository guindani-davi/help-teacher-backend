import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { LoginDTO } from '../../dtos/login.dto';
import { RefreshTokenDTO } from '../../dtos/refresh-token.dto';
import { RequestPasswordResetDTO } from '../../dtos/request-password-reset.dto';
import { ResetPasswordDTO } from '../../dtos/reset-password.dto';
import { AuthTokensResponse } from '../../responses/auth-tokens.response';
import { IAuthService } from '../../service/i.auth.service';
import { IAuthController } from '../i.auth.controller';

@Controller('auth')
export class AuthController extends IAuthController {
  public constructor(@Inject(IAuthService) authService: IAuthService) {
    super(authService);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() body: LoginDTO): Promise<AuthTokensResponse> {
    return await this.authService.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
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
  public async requestPasswordReset(
    @Body() body: RequestPasswordResetDTO,
  ): Promise<void> {
    await this.authService.requestPasswordReset(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async resetPassword(@Body() body: ResetPasswordDTO): Promise<void> {
    await this.authService.resetPassword(body);
  }
}
