import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { InvalidCredentialsException } from 'src/auth/exceptions/invalid-credentials.exception';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { IEmailService } from '../../../email/services/i.email.service';
import { IUsersService } from '../../../users/services/i.users.service';
import { LoginDTO } from '../../dtos/login.dto';
import { RefreshTokenDTO } from '../../dtos/refresh-token.dto';
import { RequestPasswordResetDTO } from '../../dtos/request-password-reset.dto';
import { ResetPasswordDTO } from '../../dtos/reset-password.dto';
import { InvalidRefreshTokenException } from '../../exceptions/invalid-refresh-token.exception';
import { InvalidResetTokenException } from '../../exceptions/invalid-reset-token.exception';
import { AuthTokensResponse } from '../../models/auth-tokens-response.model';
import { JwtPayload } from '../../models/jwt.model';
import { IAuthService } from '../i.auth.service';

@Injectable()
export class AuthService extends IAuthService {
  private readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 3600_000;
  private readonly logger: Logger;

  public constructor(
    @Inject(IUsersService) userService: IUsersService,
    @Inject(JwtService) jwtService: JwtService,
    @Inject(IEmailService) emailService: IEmailService,
    @Inject(IDatabaseService) databaseService: IDatabaseService,
  ) {
    super(userService, jwtService, emailService, databaseService);
    this.logger = new Logger(AuthService.name);
  }

  public async login(dto: LoginDTO): Promise<AuthTokensResponse> {
    const payload = await this.validateUser(dto);

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.generateRefreshToken(payload.sub);

    return new AuthTokensResponse(accessToken, refreshToken);
  }

  public async refresh(dto: RefreshTokenDTO): Promise<AuthTokensResponse> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');

    const result = await this.databaseService
      .from('refresh_tokens')
      .select()
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!result.data) {
      throw new InvalidRefreshTokenException();
    }

    await this.databaseService
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', result.data.id);

    const user = await this.userService.getUserById({
      id: result.data.user_id,
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      locale: user.locale,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.generateRefreshToken(result.data.user_id);

    return new AuthTokensResponse(accessToken, refreshToken);
  }

  public async logout(dto: RefreshTokenDTO): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');

    await this.databaseService
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null);
  }

  public async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.databaseService
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);
  }

  public async requestPasswordReset(
    dto: RequestPasswordResetDTO,
  ): Promise<void> {
    try {
      const user = await this.userService.getUserByEmail({
        email: dto.email,
      });

      await this.databaseService
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('used_at', null);

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      await this.databaseService.from('password_reset_tokens').insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      });

      await this.emailService.sendPasswordResetEmail(
        dto.email,
        rawToken,
        user.locale,
      );
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        return;
      }

      this.logger.error(
        `Unexpected error during password reset request for ${dto.email}`,
        error,
      );
      throw error;
    }
  }

  public async resetPassword(dto: ResetPasswordDTO): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const result = await this.databaseService
      .from('password_reset_tokens')
      .select()
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!result.data) {
      throw new InvalidResetTokenException();
    }

    await Promise.all([
      this.userService.updatePassword(result.data.user_id, dto.newPassword),
      this.databaseService
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', result.data.id),
      this.revokeAllUserRefreshTokens(result.data.user_id),
    ]);
  }

  private async validateUser(dto: LoginDTO): Promise<JwtPayload> {
    try {
      const returnedUser = await this.userService.getUserByEmail({
        email: dto.email,
      });

      const passwordsMatch = await this.userService.comparePasswords(
        dto.password,
        returnedUser.hashedPassword,
      );

      if (!passwordsMatch) {
        throw new InvalidCredentialsException();
      }

      return {
        sub: returnedUser.id,
        email: returnedUser.email,
        locale: returnedUser.locale,
      };
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw new InvalidCredentialsException();
      }

      throw error;
    }
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.databaseService.from('refresh_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: new Date(
        Date.now() + this.REFRESH_TOKEN_EXPIRY_MS,
      ).toISOString(),
    });

    return rawToken;
  }
}
