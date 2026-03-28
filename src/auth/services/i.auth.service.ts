import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IEmailService } from '../../email/services/i.email.service';
import { IUsersService } from '../../users/services/i.users.service';
import { LoginDTO } from '../dtos/login.dto';
import { RefreshTokenDTO } from '../dtos/refresh-token.dto';
import { RequestPasswordResetDTO } from '../dtos/request-password-reset.dto';
import { ResetPasswordDTO } from '../dtos/reset-password.dto';
import { AuthTokensResponse } from '../models/auth-tokens-response.model';

@Injectable()
export abstract class IAuthService {
  protected readonly userService: IUsersService;
  protected readonly jwtService: JwtService;
  protected readonly emailService: IEmailService;
  protected readonly databaseService: IDatabaseService;

  public constructor(
    userService: IUsersService,
    jwtService: JwtService,
    emailService: IEmailService,
    databaseService: IDatabaseService,
  ) {
    this.userService = userService;
    this.jwtService = jwtService;
    this.emailService = emailService;
    this.databaseService = databaseService;
  }

  public abstract login(dto: LoginDTO): Promise<AuthTokensResponse>;
  public abstract refresh(dto: RefreshTokenDTO): Promise<AuthTokensResponse>;
  public abstract logout(dto: RefreshTokenDTO): Promise<void>;
  public abstract revokeAllUserRefreshTokens(userId: string): Promise<void>;
  public abstract requestPasswordReset(
    dto: RequestPasswordResetDTO,
  ): Promise<void>;
  public abstract resetPassword(dto: ResetPasswordDTO): Promise<void>;
}
