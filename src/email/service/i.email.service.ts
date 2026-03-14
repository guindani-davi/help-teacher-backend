import { ConfigService } from '@nestjs/config';

export abstract class IEmailService {
  protected readonly fromAddress: string;
  protected readonly frontendUrl: string;

  public constructor(configService: ConfigService) {
    this.fromAddress = configService.getOrThrow<string>('EMAIL_FROM');
    this.frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');
  }

  public abstract sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<void>;

  public abstract sendInviteEmail(
    to: string,
    organizationName: string,
  ): Promise<void>;

  protected escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
