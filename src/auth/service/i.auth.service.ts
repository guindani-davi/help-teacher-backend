import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IDatabaseService } from '../../database/service/i.database.service';
import { IEmailService } from '../../email/service/i.email.service';
import { ISubscriptionsRepository } from '../../subscriptions/repository/i.subscriptions.repository';
import { IUsersService } from '../../users/service/i.users.service';
import { LoginDTO } from '../dtos/login.dto';
import { RefreshTokenDTO } from '../dtos/refresh-token.dto';
import { RequestPasswordResetDTO } from '../dtos/request-password-reset.dto';
import { ResetPasswordDTO } from '../dtos/reset-password.dto';
import { JwtPayload } from '../payloads/jwt.payload';
import { AuthTokensResponse } from '../responses/auth-tokens.response';

@Injectable()
export abstract class IAuthService {
  protected readonly userService: IUsersService;
  protected readonly jwtService: JwtService;
  protected readonly emailService: IEmailService;
  protected readonly databaseService: IDatabaseService;
  protected readonly subscriptionsRepository: ISubscriptionsRepository;

  public constructor(
    userService: IUsersService,
    jwtService: JwtService,
    emailService: IEmailService,
    databaseService: IDatabaseService,
    subscriptionsRepository: ISubscriptionsRepository,
  ) {
    this.userService = userService;
    this.jwtService = jwtService;
    this.emailService = emailService;
    this.databaseService = databaseService;
    this.subscriptionsRepository = subscriptionsRepository;
  }

  public abstract login(dto: LoginDTO): Promise<AuthTokensResponse>;
  public abstract refresh(dto: RefreshTokenDTO): Promise<AuthTokensResponse>;
  public abstract logout(dto: RefreshTokenDTO): Promise<void>;
  public abstract revokeAllUserRefreshTokens(userId: string): Promise<void>;
  public abstract requestPasswordReset(
    dto: RequestPasswordResetDTO,
  ): Promise<void>;
  public abstract resetPassword(dto: ResetPasswordDTO): Promise<void>;
  protected abstract validateUser(
    dto: LoginDTO,
  ): Promise<Omit<JwtPayload, 'subscriptionTier'>>;
  protected abstract generateRefreshToken(userId: string): Promise<string>;
}
