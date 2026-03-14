import { ConfigService } from '@nestjs/config';

export abstract class IEmailService {
  protected readonly fromAddress: string;
  protected readonly frontendUrl: string;
  private readonly configService: ConfigService;

  public constructor(configService: ConfigService) {
    this.configService = configService;
    this.fromAddress = this.configService.getOrThrow<string>('EMAIL_FROM');
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  public abstract sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<void>;

  public abstract sendInviteEmail(
    to: string,
    organizationName: string,
  ): Promise<void>;
}
