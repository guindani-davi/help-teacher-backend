import { LoginDTO } from '../dtos/login.dto';
import { RefreshTokenDTO } from '../dtos/refresh-token.dto';
import { RequestPasswordResetDTO } from '../dtos/request-password-reset.dto';
import { ResetPasswordDTO } from '../dtos/reset-password.dto';
import { AuthTokensResponse } from '../models/auth-tokens-response.model';
import { IAuthService } from '../services/i.auth.service';

export abstract class IAuthController {
  protected readonly authService: IAuthService;

  public constructor(authService: IAuthService) {
    this.authService = authService;
  }

  public abstract login(body: LoginDTO): Promise<AuthTokensResponse>;
  public abstract refresh(body: RefreshTokenDTO): Promise<AuthTokensResponse>;
  public abstract logout(body: RefreshTokenDTO): Promise<void>;
  public abstract requestPasswordReset(
    body: RequestPasswordResetDTO,
  ): Promise<void>;
  public abstract resetPassword(body: ResetPasswordDTO): Promise<void>;
}
